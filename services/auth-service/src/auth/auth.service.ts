import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CredentialScope, Prisma, SellerStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordCodeDto,
  ResetPasswordDto,
  SellerRegisterDto,
  SellerLegalProfileDto,
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
        include: { user: true, credentials: true },
      });

      if (existingAccount?.user) {
        throw new ConflictException('Buyer profile already exists');
      }

      if (existingAccount) {
        await this.prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              accountId: existingAccount.id,
              displayName: dto.name,
            },
          });

          await tx.accountCredential.create({
            data: {
              accountId: existingAccount.id,
              scope: CredentialScope.BUYER,
              passwordHash,
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

      await this.prisma.account.create({
        data: {
          email,
          verificationCode: hashedCode,
          verificationCodeExpires: expiresAt,
          user: {
            create: {
              displayName: dto.name,
            },
          },
          credentials: {
            create: {
              scope: CredentialScope.BUYER,
              passwordHash,
            },
          },
        },
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
        include: { seller: true, credentials: true },
      });

      if (existingAccount?.seller) {
        throw new ConflictException('Seller profile already exists');
      }

      if (existingAccount) {
        await this.prisma.$transaction(async (tx) => {
          await tx.userSeller.create({
            data: {
              accountId: existingAccount.id,
              storeName: dto.storeName,
              ownerEmail: email,
              ownerName: dto.storeName,
              agreementAcceptedAt: new Date(),
              legalName: dto.legalName,
              inn: dto.inn,
              phone: dto.phone,
            },
          });

          await tx.accountCredential.create({
            data: {
              accountId: existingAccount.id,
              scope: CredentialScope.SELLER,
              passwordHash,
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

      await this.prisma.account.create({
        data: {
          email,
          verificationCode: hashedCode,
          verificationCodeExpires: expiresAt,
          seller: {
            create: {
              storeName: dto.storeName,
              ownerEmail: email,
              ownerName: dto.storeName,
              agreementAcceptedAt: new Date(),
              legalName: dto.legalName,
              inn: dto.inn,
              phone: dto.phone,
            },
          },
          credentials: {
            create: {
              scope: CredentialScope.SELLER,
              passwordHash,
            },
          },
        },
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
      CredentialScope.BUYER,
    );

    if (!account.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const tokens = await this.generateTokens(account.id, CredentialScope.BUYER);
    await this.storeRefreshToken(
      account.id,
      CredentialScope.BUYER,
      tokens.refreshToken,
    );

    return tokens;
  }

  async sellerLogin(dto: LoginDto) {
    const account = await this.validateAccountCredentials(
      dto.email,
      dto.password,
      CredentialScope.SELLER,
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

    const tokens = await this.generateTokens(account.id, CredentialScope.SELLER);
    await this.storeRefreshToken(
      account.id,
      CredentialScope.SELLER,
      tokens.refreshToken,
    );

    return tokens;
  }

  async refreshTokens(refreshToken: string, scope: CredentialScope) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      if (payload.scope !== scope) {
        throw new UnauthorizedException();
      }

      const credential = await this.prisma.accountCredential.findUnique({
        where: {
          accountId_scope: {
            accountId: payload.sub,
            scope,
          },
        },
      });

      if (!credential?.refreshTokenHash) {
        throw new UnauthorizedException();
      }

      const refreshValid = await bcrypt.compare(
        refreshToken,
        credential.refreshTokenHash,
      );

      if (!refreshValid) {
        throw new UnauthorizedException();
      }

      const tokens = await this.generateTokens(credential.accountId, scope);
      await this.storeRefreshToken(
        credential.accountId,
        scope,
        tokens.refreshToken,
      );

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
        ownerEmail: true,
        ownerName: true,
        status: true,
        reviewComment: true,
        submittedAt: true,
        reviewedAt: true,
        agreementAcceptedAt: true,
        legalName: true,
        inn: true,
        phone: true,
        legalProfile: true,
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

  async upsertSellerLegalProfile(
    accountId: string,
    dto: SellerLegalProfileDto,
  ) {
    const seller = await this.getSellerForLegalUpdate(accountId);
    const legalProfile = this.normalizeSellerLegalProfile(dto);

    return this.prisma.sellerLegalProfile.upsert({
      where: { sellerId: seller.id },
      create: {
        sellerId: seller.id,
        ...legalProfile,
      },
      update: legalProfile,
    });
  }

  async submitSellerLegalProfile(accountId: string) {
    const seller = await this.getSellerForLegalUpdate(accountId);
    const legalProfile = await this.prisma.sellerLegalProfile.findUnique({
      where: { sellerId: seller.id },
    });

    if (!legalProfile) {
      throw new BadRequestException('Legal data must be filled first');
    }

    await this.prisma.userSeller.update({
      where: { id: seller.id },
      data: {
        status: SellerStatus.UNDER_REVIEW,
        reviewComment: null,
        submittedAt: new Date(),
        reviewedAt: null,
      },
    });

    return {
      message: 'Legal data submitted for review',
      status: SellerStatus.UNDER_REVIEW,
    };
  }

  async getSellersForReview() {
    return this.prisma.userSeller.findMany({
      where: { status: SellerStatus.UNDER_REVIEW },
      include: {
        account: { select: { email: true, isEmailVerified: true } },
        legalProfile: true,
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async approveSeller(sellerId: string) {
    return this.prisma.userSeller.update({
      where: { id: sellerId },
      data: {
        status: SellerStatus.ACTIVATED,
        reviewComment: null,
        reviewedAt: new Date(),
      },
      include: { legalProfile: true },
    });
  }

  async rejectSeller(sellerId: string, comment: string) {
    return this.prisma.userSeller.update({
      where: { id: sellerId },
      data: {
        status: SellerStatus.REJECTED,
        reviewComment: comment,
        reviewedAt: new Date(),
      },
      include: { legalProfile: true },
    });
  }

  forgotPassword(dto: ForgotPasswordDto) {
    return this.forgotPasswordForScope(dto, CredentialScope.BUYER);
  }

  forgotSellerPassword(dto: ForgotPasswordDto) {
    return this.forgotPasswordForScope(dto, CredentialScope.SELLER);
  }

  resetPassword(dto: ResetPasswordDto) {
    return this.resetPasswordForScope(dto, CredentialScope.BUYER);
  }

  async verifyResetPasswordCode(dto: ResetPasswordCodeDto) {
    await this.findValidResetCredential(dto, CredentialScope.BUYER);

    return { message: 'Reset code is valid' };
  }

  resetSellerPassword(dto: ResetPasswordDto) {
    return this.resetPasswordForScope(dto, CredentialScope.SELLER);
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

  async logout(accountId: string, scope: CredentialScope) {
    await this.prisma.accountCredential.updateMany({
      where: { accountId, scope },
      data: { refreshTokenHash: null },
    });
  }

  private async getSellerForLegalUpdate(accountId: string) {
    const seller = await this.prisma.userSeller.findUnique({
      where: { accountId },
    });

    if (!seller) {
      throw new ForbiddenException('Seller profile not found');
    }

    if (seller.status === SellerStatus.SUSPENDED) {
      throw new ForbiddenException('Seller profile is suspended');
    }

    if (seller.status === SellerStatus.ACTIVATED) {
      throw new BadRequestException('Activated seller legal data is locked');
    }

    return seller;
  }

  private async forgotPasswordForScope(
    dto: ForgotPasswordDto,
    scope: CredentialScope,
  ) {
    const email = this.normalizeEmail(dto.email);
    const account = await this.prisma.account.findUnique({
      where: { email },
    });

    if (!account) {
      return {
        message: 'If this email exists, reset instructions were sent.',
      };
    }

    const credential = await this.prisma.accountCredential.findUnique({
      where: {
        accountId_scope: {
          accountId: account.id,
          scope,
        },
      },
    });

    if (!credential) {
      return {
        message: 'If this email exists, reset instructions were sent.',
      };
    }

    const { hashedCode, code, expiresAt } =
      await this.createVerificationCode();

    await this.prisma.accountCredential.update({
      where: { id: credential.id },
      data: {
        resetCode: hashedCode,
        resetCodeExpires: expiresAt,
      },
    });

    await this.emailService.sendVerificationCode(email, code);

    return {
      message: 'If this email exists, reset instructions were sent.',
    };
  }

  private async resetPasswordForScope(
    dto: ResetPasswordDto,
    scope: CredentialScope,
  ) {
    const credential = await this.findValidResetCredential(dto, scope);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.accountCredential.update({
      where: { id: credential.id },
      data: {
        passwordHash,
        refreshTokenHash: null,
        resetCode: null,
        resetCodeExpires: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  private async findValidResetCredential(
    dto: ResetPasswordCodeDto,
    scope: CredentialScope,
  ) {
    const email = this.normalizeEmail(dto.email);

    const account = await this.prisma.account.findUnique({
      where: { email },
    });

    if (!account) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const credential = await this.prisma.accountCredential.findFirst({
      where: {
        accountId: account.id,
        scope,
        resetCodeExpires: { gt: new Date() },
      },
    });

    if (!credential?.resetCode) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const codeValid = await bcrypt.compare(dto.code, credential.resetCode);

    if (!codeValid) {
      throw new BadRequestException('Invalid reset code');
    }

    return credential;
  }

  private async validateAccountCredentials(
    email: string,
    password: string,
    scope: CredentialScope,
  ) {
    const normalizedEmail = this.normalizeEmail(email);

    const account = await this.prisma.account.findUnique({
      where: { email: normalizedEmail },
      include: {
        credentials: {
          where: { scope },
        },
      },
    });

    const credential = account?.credentials[0];

    if (!account || !credential) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(
      password,
      credential.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return account;
  }

  private async generateTokens(accountId: string, scope: CredentialScope) {
    const payload = { sub: accountId, scope };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    accountId: string,
    scope: CredentialScope,
    refreshToken: string,
  ) {
    const hash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.accountCredential.update({
      where: {
        accountId_scope: {
          accountId,
          scope,
        },
      },
      data: { refreshTokenHash: hash },
    });
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizeSellerLegalProfile(dto: SellerLegalProfileDto) {
    return {
      businessType: dto.businessType,
      taxId: dto.taxId.replace(/\D/g, ''),
      legalName: dto.legalName.trim(),
      legalAddress: dto.legalAddress.trim(),
      bankName: dto.bankName.trim(),
      iban: dto.iban.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
    };
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
