import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SellerRegisterDto,
  VerifyEmailDto,
} from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const { hashedCode, code, expiresAt } =
      await this.createVerificationCode();

    try {
      const existingAccount = await this.prisma.account.findUnique({
        where: { email },
        include: { user: true },
      });

      if (existingAccount?.user) {
        throw new ConflictException('Buyer profile already exists');
      }

      if (existingAccount) {
        const passwordValid = await bcrypt.compare(
          dto.password,
          existingAccount.passwordHash,
        );

        if (!passwordValid) {
          throw new UnauthorizedException('Invalid credentials');
        }

        await this.prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              accountId: existingAccount.id,
              displayName: dto.name,
            },
          });

          await tx.account.update({
            where: { id: existingAccount.id },
            data: {
              verificationCode: hashedCode,
              verificationCodeExpires: expiresAt,
            },
          });
        });

        await this.emailService.sendVerificationCode(email, code);

        return { message: 'Buyer profile created successfully' };
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.account.create({
          data: {
            email,
            passwordHash,
            verificationCode: hashedCode,
            verificationCodeExpires: expiresAt,
            user: {
              create: {
                displayName: dto.name,
              },
            },
          },
        });
      });

      await this.emailService.sendVerificationCode(email, code);

      return {
        message:
          'Registration successful. Check your email for verification code.',
      };
    } catch (error) {
      this.handleUniqueConflict(error);
      throw error;
    }
  }

  async registerSeller(dto: SellerRegisterDto) {
    if (!dto.agreementAccepted) {
      throw new BadRequestException('Seller agreement must be accepted');
    }

    const email = this.normalizeEmail(dto.email);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const { hashedCode, code, expiresAt } =
      await this.createVerificationCode();

    try {
      const existingAccount = await this.prisma.account.findUnique({
        where: { email },
        include: { seller: true },
      });

      if (existingAccount?.seller) {
        throw new ConflictException('Seller profile already exists');
      }

      if (existingAccount) {
        const passwordValid = await bcrypt.compare(
          dto.password,
          existingAccount.passwordHash,
        );

        if (!passwordValid) {
          throw new UnauthorizedException('Invalid credentials');
        }

        await this.prisma.$transaction(async (tx) => {
          await tx.userSeller.create({
            data: {
              accountId: existingAccount.id,
              storeName: dto.storeName,
              agreementAcceptedAt: new Date(),
              legalName: dto.legalName,
              inn: dto.inn,
              phone: dto.phone,
            },
          });

          await tx.account.update({
            where: { id: existingAccount.id },
            data: {
              verificationCode: hashedCode,
              verificationCodeExpires: expiresAt,
            },
          });
        });

        await this.emailService.sendVerificationCode(email, code);

        return { message: 'Seller profile created successfully' };
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.account.create({
          data: {
            email,
            passwordHash,
            verificationCode: hashedCode,
            verificationCodeExpires: expiresAt,
            seller: {
              create: {
                storeName: dto.storeName,
                agreementAcceptedAt: new Date(),
                legalName: dto.legalName,
                inn: dto.inn,
                phone: dto.phone,
              },
            },
          },
        });
      });

      await this.emailService.sendVerificationCode(email, code);

      return {
        message:
          'Seller registration successful. Check your email for verification code.',
      };
    } catch (error) {
      this.handleUniqueConflict(error);
      throw error;
    }
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const email = this.normalizeEmail(dto.email);

    const account = await this.prisma.account.findFirst({
      where: {
        email,
        verificationCodeExpires: { gt: new Date() },
      },
    });

    if (!account?.verificationCode) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const codeValid = await bcrypt.compare(dto.code, account.verificationCode);

    if (!codeValid) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async login(dto: LoginDto) {
    const account = await this.validateAccountCredentials(
      dto.email,
      dto.password,
    );

    if (!account.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const tokens = await this.generateTokens(account.id);
    await this.storeRefreshToken(account.id, tokens.refreshToken);

    return tokens;
  }

  async sellerLogin(dto: LoginDto) {
    const account = await this.validateAccountCredentials(
      dto.email,
      dto.password,
    );

    if (!account.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const seller = await this.prisma.userSeller.findUnique({
      where: { accountId: account.id },
    });

    if (!seller) {
      throw new ForbiddenException('Seller profile not found');
    }

    if (seller.status === 'SUSPENDED') {
      throw new ForbiddenException('Seller profile is suspended');
    }

    const tokens = await this.generateTokens(account.id);
    await this.storeRefreshToken(account.id, tokens.refreshToken);

    return tokens;
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const account = await this.prisma.account.findUnique({
        where: { id: payload.sub },
      });

      if (!account?.refreshTokenHash) {
        throw new UnauthorizedException();
      }

      const refreshValid = await bcrypt.compare(
        refreshToken,
        account.refreshTokenHash,
      );

      if (!refreshValid) {
        throw new UnauthorizedException();
      }

      const tokens = await this.generateTokens(account.id);
      await this.storeRefreshToken(account.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getMe(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        user: true,
        seller: true,
      },
    });

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    return {
      id: account.id,
      email: account.email,
      name: account.user?.displayName ?? null,
      displayName: account.user?.displayName ?? null,
      isEmailVerified: account.isEmailVerified,
      hasUserProfile: Boolean(account.user),
      hasSellerProfile: Boolean(account.seller),
      sellerStatus: account.seller?.status ?? null,
      createdAt: account.createdAt,
    };
  }

  async getUserMe(accountId: string) {
    const user = await this.prisma.user.findUnique({
      where: { accountId },
      select: {
        id: true,
        accountId: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('Buyer profile not found');
    }

    return user;
  }

  async getSellerMe(accountId: string) {
    const seller = await this.prisma.userSeller.findUnique({
      where: { accountId },
      select: {
        id: true,
        accountId: true,
        storeName: true,
        status: true,
        agreementAcceptedAt: true,
        legalName: true,
        inn: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!seller) {
      throw new ForbiddenException('Seller profile not found');
    }

    if (seller.status === 'SUSPENDED') {
      throw new ForbiddenException('Seller profile is suspended');
    }

    return seller;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = this.normalizeEmail(dto.email);
    const account = await this.prisma.account.findUnique({
      where: { email },
    });

    if (!account) {
      return {
        message: 'If this email exists, reset instructions were sent.',
      };
    }

    const { hashedCode, code, expiresAt } =
      await this.createVerificationCode();

    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        verificationCode: hashedCode,
        verificationCodeExpires: expiresAt,
      },
    });

    await this.emailService.sendVerificationCode(email, code);

    return {
      message: 'If this email exists, reset instructions were sent.',
    };
  }

  async resendVerificationCode(dto: ForgotPasswordDto) {
    const email = this.normalizeEmail(dto.email);
    const account = await this.prisma.account.findUnique({
      where: { email },
    });

    if (!account) {
      return {
        message: 'If this email exists, verification code was sent.',
      };
    }

    const { hashedCode, code, expiresAt } =
      await this.createVerificationCode();

    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        verificationCode: hashedCode,
        verificationCodeExpires: expiresAt,
      },
    });

    await this.emailService.sendVerificationCode(email, code);

    return {
      message: 'If this email exists, verification code was sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = this.normalizeEmail(dto.email);

    const account = await this.prisma.account.findFirst({
      where: {
        email,
        verificationCodeExpires: { gt: new Date() },
      },
    });

    if (!account?.verificationCode) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const codeValid = await bcrypt.compare(dto.code, account.verificationCode);

    if (!codeValid) {
      throw new BadRequestException('Invalid reset code');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        passwordHash,
        refreshTokenHash: null,
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async logout(accountId: string) {
    await this.prisma.account.update({
      where: { id: accountId },
      data: { refreshTokenHash: null },
    });
  }

  private async validateAccountCredentials(email: string, password: string) {
    const normalizedEmail = this.normalizeEmail(email);

    const account = await this.prisma.account.findUnique({
      where: { email: normalizedEmail },
    });

    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, account.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return account;
  }

  private async generateTokens(accountId: string) {
    const accessToken = this.jwtService.sign(
      { sub: accountId },
      { secret: this.configService.get('JWT_ACCESS_SECRET'), expiresIn: '15m' },
    );

    const refreshToken = this.jwtService.sign(
      { sub: accountId },
      { secret: this.configService.get('JWT_REFRESH_SECRET'), expiresIn: '7d' },
    );

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(accountId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.account.update({
      where: { id: accountId },
      data: { refreshTokenHash: hash },
    });
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private async createVerificationCode() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(code, 8);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    return { code, hashedCode, expiresAt };
  }

  private handleUniqueConflict(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Account or profile already exists');
    }
  }
}
