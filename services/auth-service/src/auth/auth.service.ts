import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';
import { RegisterDto, LoginDto, VerifyEmailDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const hashedCode = await bcrypt.hash(verificationCode, 8); // хэшируем код
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        verificationCode: hashedCode, // сохраняем хэш
        verificationCodeExpires: codeExpires,
      },
    });

    await this.emailService.sendVerificationCode(dto.email, verificationCode); // отправляем оригинальный код
    return {
      message:
        'Registration successful. Check your email for verification code.',
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    // Ищем пользователя по email и неистекшему сроку действия кода
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        verificationCodeExpires: { gt: new Date() },
      },
    });
    if (!user || !user.verificationCode) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const codeValid = await bcrypt.compare(dto.code, user.verificationCode);
    if (!codeValid) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });
    return { message: 'Email verified successfully' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isEmailVerified)
      throw new UnauthorizedException('Please verify your email first');

    const tokens = await this.generateTokens(user.id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user || !user.refreshTokenHash) throw new UnauthorizedException();

      const refreshValid = await bcrypt.compare(
        refreshToken,
        user.refreshTokenHash,
      );
      if (!refreshValid) throw new UnauthorizedException();

      const tokens = await this.generateTokens(user.id);
      await this.storeRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  private async generateTokens(userId: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId },
      { secret: this.configService.get('JWT_ACCESS_SECRET'), expiresIn: '15m' },
    );
    const refreshToken = this.jwtService.sign(
      { sub: userId },
      { secret: this.configService.get('JWT_REFRESH_SECRET'), expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }
}
