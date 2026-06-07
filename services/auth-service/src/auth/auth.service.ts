import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
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
  UpdateBuyerProfileDto,
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

  // Регистрирует buyer-профиль и отправляет код подтверждения email.
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
              email,
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
              email,
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

  // Регистрирует seller-профиль, юридические базовые данные и отдельные seller credentials.
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
              email,
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
              email,
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

  // Подтверждает email аккаунта по последнему действующему коду.
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

  // Авторизует покупателя, проверяет email verification и создает buyer tokens.
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

  // Авторизует продавца, проверяет seller-профиль и создает seller tokens.
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

  // Проверяет refresh token нужного scope и выпускает новую пару токенов.
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

  // Возвращает сводную информацию аккаунта для текущей buyer-сессии.
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
      email: account.user?.email ?? account.email,
      name: account.user?.displayName ?? null,
      displayName: account.user?.displayName ?? null,
      phone: account.user?.phone ?? null,
      isEmailVerified: account.isEmailVerified,
      hasUserProfile: Boolean(account.user),
      hasSellerProfile: Boolean(account.seller),
      sellerStatus: account.seller?.status ?? null,
      avatar: account.user?.avatar ?? null,
      createdAt: account.createdAt,
    };
  }

  // Возвращает buyer-профиль текущего аккаунта.
  async getUserMe(accountId: string) {
    const user = await this.prisma.user.findUnique({
      where: { accountId },
      select: {
        id: true,
        accountId: true,
        email: true,
        displayName: true,
        phone: true,
        birthDate: true,
        gender: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('Buyer profile not found');
    }

    return user;
  }

  // Обновляет buyer-профиль текущего аккаунта, включая displayName и phone.
  async updateUserMe(accountId: string, dto: UpdateBuyerProfileDto) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!account?.user) {
      throw new ForbiddenException('Buyer profile not found');
    }

    const userId = account.user.id;
    const userData: Prisma.UserUpdateInput = {};
    const accountData: Prisma.AccountUpdateInput = {};
    const sellerData: Prisma.UserSellerUpdateInput = {};

    if (dto.displayName !== undefined) {
      const displayName = dto.displayName.trim();

      if (displayName.length < 2) {
        throw new BadRequestException('Display name must be at least 2 characters');
      }

      userData.displayName = displayName;
    }

    if (dto.email !== undefined) {
      const email = this.normalizeEmail(dto.email);

      if (email !== account.email) {
        accountData.email = email;
      }

      if (email !== account.user.email) {
        userData.email = email;
      }

      if (account.seller) {
        sellerData.email = email;
        sellerData.ownerEmail = email;
      }
    }

    if (dto.phone !== undefined) {
      userData.phone = this.normalizeBuyerPhone(dto.phone);
    }

    if (dto.birthDate !== undefined) {
      userData.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    }

    if (dto.gender !== undefined) {
      userData.gender = dto.gender;
    }

    if (dto.avatar !== undefined) {
      userData.avatar = dto.avatar;
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (Object.keys(accountData).length > 0) {
          await tx.account.update({
            where: { id: account.id },
            data: accountData,
          });
        }

        if (account.seller && Object.keys(sellerData).length > 0) {
          await tx.userSeller.update({
            where: { id: account.seller.id },
            data: sellerData,
          });
        }

        return tx.user.update({
          where: { id: userId },
          data: userData,
          select: {
            id: true,
            accountId: true,
            email: true,
            displayName: true,
            phone: true,
            birthDate: true,
            gender: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      });
    } catch (error) {
      this.handleUniqueConflict(error);
      throw error;
    }
  }

  // Возвращает seller-профиль текущего аккаунта и блокирует suspended sellers.
  async getSellerMe(accountId: string) {
    const seller = await this.prisma.userSeller.findUnique({
      where: { accountId },
      select: {
        id: true,
        accountId: true,
        email: true,
        storeName: true,
        description: true,
        city: true,
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

  // Обновляет базовый профиль продавца (магазина)
  async updateSellerMe(accountId: string, dto: any) {
    const seller = await this.prisma.userSeller.findUnique({
      where: { accountId },
    });

    if (!seller) {
      throw new ForbiddenException('Seller profile not found');
    }

    if (seller.status === 'SUSPENDED') {
      throw new ForbiddenException('Seller profile is suspended');
    }

    return this.prisma.userSeller.update({
      where: { id: seller.id },
      data: {
        ...(dto.storeName !== undefined && { storeName: dto.storeName }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
      },
      select: {
        id: true,
        accountId: true,
        email: true,
        storeName: true,
        description: true,
        city: true,
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
  }

  async pauseSellerStore(accountId: string) {
    return this.updateSellerStoreStatus(
      accountId,
      SellerStatus.ACTIVATED,
      SellerStatus.PAUSED,
      'Only activated stores can be paused',
    );
  }

  async resumeSellerStore(accountId: string) {
    return this.updateSellerStoreStatus(
      accountId,
      SellerStatus.PAUSED,
      SellerStatus.ACTIVATED,
      'Only paused stores can be resumed',
    );
  }


  // Создает или обновляет юридические данные продавца до активации магазина.
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

  // Отправляет заполненные юридические данные продавца на ручную модерацию.
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

  // Возвращает продавцов, ожидающих ручной legal review.
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

  // Активирует продавца после успешной модерации legal data.
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

  // Отклоняет legal review продавца и сохраняет комментарий модератора.
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

  // Запускает восстановление buyer-пароля.
  forgotPassword(dto: ForgotPasswordDto) {
    return this.forgotPasswordForScope(dto, CredentialScope.BUYER);
  }

  // Запускает восстановление seller-пароля.
  forgotSellerPassword(dto: ForgotPasswordDto) {
    return this.forgotPasswordForScope(dto, CredentialScope.SELLER);
  }

  // Меняет buyer-пароль по валидному reset-коду.
  resetPassword(dto: ResetPasswordDto) {
    return this.resetPasswordForScope(dto, CredentialScope.BUYER);
  }

  // Проверяет buyer reset-код до ввода нового пароля.
  async verifyResetPasswordCode(dto: ResetPasswordCodeDto) {
    await this.findValidResetCredential(dto, CredentialScope.BUYER);

    return { message: 'Reset code is valid' };
  }

  // Проверяет seller reset-код до ввода нового пароля.
  async verifySellerResetPasswordCode(dto: ResetPasswordCodeDto) {
    await this.findValidResetCredential(dto, CredentialScope.SELLER);

    return { message: 'Reset code is valid' };
  }

  // Меняет seller-пароль по валидному reset-коду.
  resetSellerPassword(dto: ResetPasswordDto) {
    return this.resetPasswordForScope(dto, CredentialScope.SELLER);
  }

  // Генерирует и отправляет новый код подтверждения email.
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

  // Сбрасывает refresh token hash для выхода из buyer или seller-сессии.
  async logout(accountId: string, scope: CredentialScope) {
    await this.prisma.accountCredential.updateMany({
      where: { accountId, scope },
      data: { refreshTokenHash: null },
    });
  }

  // Находит seller-профиль, который еще можно редактировать по legal data.
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

    if (
      seller.status === SellerStatus.ACTIVATED ||
      seller.status === SellerStatus.PAUSED
    ) {
      throw new BadRequestException('Activated seller legal data is locked');
    }

    return seller;
  }

  private async updateSellerStoreStatus(
    accountId: string,
    expectedStatus: SellerStatus,
    nextStatus: SellerStatus,
    invalidStatusMessage: string,
  ) {
    const seller = await this.prisma.userSeller.findUnique({
      where: { accountId },
    });

    if (!seller) {
      throw new ForbiddenException('Seller profile not found');
    }

    if (seller.status === SellerStatus.SUSPENDED) {
      throw new ForbiddenException('Seller profile is suspended');
    }

    if (seller.status !== expectedStatus) {
      throw new BadRequestException(invalidStatusMessage);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedSeller = await tx.userSeller.update({
        where: { id: seller.id },
        data: { status: nextStatus },
        select: {
          id: true,
          accountId: true,
          email: true,
          storeName: true,
          description: true,
          city: true,
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

      await tx.$executeRaw`UPDATE "Product" SET "storeStatus" = ${nextStatus} WHERE "sellerId" = ${seller.accountId}`;

      return updatedSeller;
    });
  }

  // Создает reset-код для buyer или seller credentials и отправляет письмо нужного назначения.
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

    await this.emailService.sendVerificationCode(
      email,
      code,
      scope === CredentialScope.SELLER
        ? 'sellerPasswordReset'
        : 'buyerPasswordReset',
    );

    return {
      message: 'If this email exists, reset instructions were sent.',
    };
  }

  // Меняет пароль для buyer или seller credentials и инвалидирует refresh-сессии.
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

  // Находит credentials с действующим reset-кодом и проверяет код через bcrypt.
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

  // Проверяет scoped credentials аккаунта по email и паролю.
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

  // Выпускает access и refresh JWT для указанного account scope.
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

  // Хэширует refresh token и сохраняет его в scoped credentials.
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
  // Авторизация модератора (по env переменным)
  async adminLogin(dto: any) {
    const expectedEmail = this.configService.get<string>('MODERATION_ADMIN_EMAIL');
    const expectedPassword = this.configService.get<string>('MODERATION_ADMIN_PASSWORD');
    const expectedKey = this.configService.get<string>('MODERATION_ADMIN_KEY');

    if (
      !expectedEmail ||
      !expectedPassword ||
      !expectedKey ||
      dto.email !== expectedEmail ||
      dto.password !== expectedPassword ||
      dto.adminKey !== expectedKey
    ) {
      throw new UnauthorizedException('Invalid moderation credentials');
    }

    return { adminKey: expectedKey };
  }

  // Поиск пользователей (покупателей) для админки
  async searchUsers(query: string) {
    const q = query.trim();
    if (!q) return [];
    
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          { displayName: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { account: true },
      take: 50,
    });

    return users.map((u) => ({
      id: u.id,
      accountId: u.accountId,
      email: u.email,
      displayName: u.displayName,
      phone: u.phone,
      isEmailVerified: u.account.isEmailVerified,
      createdAt: u.createdAt,
    }));
  }

  // Поиск продавцов для админки
  async searchSellers(query: string) {
    const q = query.trim();
    if (!q) return [];

    const sellers = await this.prisma.userSeller.findMany({
      where: {
        OR: [
          { storeName: { contains: q, mode: 'insensitive' } },
          { ownerEmail: { contains: q, mode: 'insensitive' } },
          { legalName: { contains: q, mode: 'insensitive' } },
          { inn: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        account: { select: { email: true, isEmailVerified: true } },
        legalProfile: true,
      },
      take: 50,
    });

    return sellers;
  }

  // Нормализует email для единых lookup-операций.
  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  // Нормализует buyer phone до формата E.164 или очищает пустое значение.
  private normalizeBuyerPhone(phone: string) {
    const digits = phone.replace(/\D/g, '');

    if (!digits) {
      return null;
    }

    const normalizedDigits =
      digits.length === 10
        ? `7${digits}`
        : digits.length === 11 && digits.startsWith('8')
          ? `7${digits.slice(1)}`
          : digits;

    if (!/^7\d{10}$/.test(normalizedDigits)) {
      throw new BadRequestException('Invalid phone number');
    }

    return `+${normalizedDigits}`;
  }

  // Очищает и нормализует юридические данные продавца перед записью.
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

  // Создает шестизначный код, bcrypt-хэш и срок действия на 15 минут.
  private async createVerificationCode() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(code, 8);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    return { code, hashedCode, expiresAt };
  }

  // Превращает Prisma unique conflict в понятный ConflictException.
  private handleUniqueConflict(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Account or profile already exists');
    }
  }
  // Находит публичную информацию о магазине по названию.
  async getPublicStoreProfile(storeName: string) {
    const seller = await this.prisma.userSeller.findFirst({
      where: {
        storeName: { equals: storeName, mode: 'insensitive' },
        status: SellerStatus.ACTIVATED,
      },
      select: {
        storeName: true,
        description: true,
        city: true,
        createdAt: true,
      },
    });

    if (!seller) {
      throw new NotFoundException('Store not found or not active');
    }

    return seller;
  }
}
