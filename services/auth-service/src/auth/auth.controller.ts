import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CredentialScope } from '@prisma/client';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  MessageResponseDto,
  RegisterDto,
  ResetPasswordDto,
  SellerRegisterDto,
  SellerLegalProfileDto,
  SellerLegalProfileResponseDto,
  SellerLegalSubmitResponseDto,
  RejectSellerDto,
  AdminLoginDto,
  AccountSummaryResponseDto,
  BuyerProfileResponseDto,
  ModerationSellerResponseDto,
  ResetPasswordCodeDto,
  SellerProfileResponseDto,
  UpdateBuyerProfileDto,
  VerifyEmailDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SellerJwtAuthGuard } from './guards/seller-jwt-auth.guard';
import { ModerationAdminGuard } from './guards/moderation-admin.guard';

@Throttle({ default: { limit: 5, ttl: 60000 } })
@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register buyer profile',
    description:
      'Creates a buyer User profile and BUYER credentials. If an Account with this email already exists as seller-only, the buyer profile and an independent buyer password are added to the same Account.',
  })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description: 'Buyer registered. Verification code was sent to email.',
  })
  @ApiResponse({
    status: 409,
    description: 'Buyer profile already exists.',
  })
  // POST /auth/register: регистрирует buyer-профиль.
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('seller/register')
  @ApiOperation({
    summary: 'Register seller profile',
    description:
      'Creates a seller profile and SELLER credentials for a new or existing Account. Seller password is independent from buyer password even when email is shared.',
  })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description: 'Seller registered. Verification code was sent to email.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials.',
  })
  @ApiResponse({
    status: 409,
    description: 'Seller profile already exists.',
  })
  // POST /auth/seller/register: регистрирует seller-профиль.
  async registerSeller(@Body() dto: SellerRegisterDto) {
    return this.authService.registerSeller(dto);
  }

  @Post('verify-email')
  @ApiOperation({
    summary: 'Verify email',
    description:
      'Verifies the Account email using the latest six-digit code sent to the mailbox.',
  })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description: 'Email verified successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification code.',
  })
  // POST /auth/verify-email: подтверждает email по коду.
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login buyer',
    description:
      'Authenticates BUYER credentials and sets HttpOnly accessToken and refreshToken cookies.',
  })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description: 'Buyer login successful. Sets accessToken and refreshToken cookies.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or email is not verified.',
  })
  // POST /auth/login: авторизует buyer и выставляет buyer cookies.
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    this.setAuthCookies(res, accessToken, refreshToken, {
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    });

    return { message: 'Login successful' };
  }

  @Post('seller/login')
  @ApiOperation({
    summary: 'Login seller',
    description:
      'Authenticates SELLER credentials and additionally checks that it has an active seller profile.',
  })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description:
      'Seller login successful. Sets sellerAccessToken and sellerRefreshToken cookies.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or email is not verified.',
  })
  @ApiResponse({
    status: 403,
    description: 'Seller profile not found or suspended.',
  })
  // POST /auth/seller/login: авторизует seller и выставляет seller cookies.
  async sellerLogin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.sellerLogin(dto);
    this.setAuthCookies(res, accessToken, refreshToken, {
      accessToken: 'sellerAccessToken',
      refreshToken: 'sellerRefreshToken',
    });

    return { message: 'Seller login successful' };
  }

  @Post('refresh')
  @ApiCookieAuth('refreshToken')
  @ApiOperation({
    summary: 'Refresh buyer tokens',
    description:
      'Rotates buyer accessToken and refreshToken cookies using a valid buyer refreshToken cookie.',
  })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description:
      'Buyer tokens refreshed. Sets new accessToken and refreshToken cookies.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid refresh token.',
  })
  // POST /auth/refresh: обновляет buyer tokens по refresh cookie.
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshTokens(refreshToken, CredentialScope.BUYER);

    this.setAuthCookies(res, accessToken, newRefreshToken, {
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    });

    return { message: 'Tokens refreshed' };
  }

  @Post('seller/refresh')
  @ApiCookieAuth('sellerRefreshToken')
  @ApiOperation({
    summary: 'Refresh seller tokens',
    description:
      'Rotates sellerAccessToken and sellerRefreshToken cookies using a valid sellerRefreshToken cookie.',
  })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description:
      'Seller tokens refreshed. Sets new sellerAccessToken and sellerRefreshToken cookies.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid seller refresh token.',
  })
  // POST /auth/seller/refresh: обновляет seller tokens по seller refresh cookie.
  async sellerRefresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['sellerRefreshToken'];

    if (!refreshToken) {
      throw new UnauthorizedException('No seller refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshTokens(
        refreshToken,
        CredentialScope.SELLER,
      );

    this.setAuthCookies(res, accessToken, newRefreshToken, {
      accessToken: 'sellerAccessToken',
      refreshToken: 'sellerRefreshToken',
    });

    return { message: 'Seller tokens refreshed' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: 'Get current account',
    description:
      'Returns Account identity and profile flags for the current BUYER session. JWT sub is Account.id.',
  })
  @ApiOkResponse({
    type: AccountSummaryResponseDto,
    description: 'Current account summary.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid access token.',
  })
  // GET /auth/me: возвращает summary текущего buyer account.
  async me(@Req() req: Request) {
    const accountId = (req as any).user?.sub;

    if (!accountId) {
      throw new UnauthorizedException('No account');
    }

    return this.authService.getMe(accountId);
  }

  @Get('user/me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: 'Get buyer profile',
    description:
      'Returns the buyer User profile for the current BUYER session. Requires accessToken cookie.',
  })
  @ApiOkResponse({
    type: BuyerProfileResponseDto,
    description: 'Current buyer profile.',
  })
  @ApiResponse({
    status: 403,
    description: 'Buyer profile not found.',
  })
  // GET /auth/user/me: возвращает buyer-профиль текущего аккаунта.
  async userMe(@Req() req: Request) {
    const accountId = (req as any).user?.sub;

    if (!accountId) {
      throw new UnauthorizedException('No account');
    }

    return this.authService.getUserMe(accountId);
  }

  @Put('user/me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: 'Update buyer profile',
    description:
      'Updates editable fields of the current buyer profile. Phone is normalized before saving.',
  })
  @ApiOkResponse({
    type: BuyerProfileResponseDto,
    description: 'Buyer profile was updated.',
  })
  @ApiResponse({
    status: 400,
    description: 'Buyer profile data is invalid.',
  })
  @ApiResponse({
    status: 403,
    description: 'Buyer profile not found.',
  })
  // PUT /auth/user/me: обновляет buyer-профиль текущего аккаунта.
  async updateUserMe(
    @Req() req: Request,
    @Body() dto: UpdateBuyerProfileDto,
  ) {
    const accountId = (req as any).user?.sub;

    if (!accountId) {
      throw new UnauthorizedException('No account');
    }

    return this.authService.updateUserMe(accountId, dto);
  }

  @Get('seller/me')
  @UseGuards(SellerJwtAuthGuard)
  @ApiCookieAuth('sellerAccessToken')
  @ApiOperation({
    summary: 'Get seller profile',
    description:
      'Returns the seller profile for the current SELLER session. Requires sellerAccessToken cookie. Suspended sellers are rejected.',
  })
  @ApiOkResponse({
    type: SellerProfileResponseDto,
    description: 'Current seller profile.',
  })
  @ApiResponse({
    status: 403,
    description: 'Seller profile not found or suspended.',
  })
  // GET /auth/seller/me: возвращает seller-профиль текущего аккаунта.
  async sellerMe(@Req() req: Request) {
    const accountId = (req as any).user?.sub;

    if (!accountId) {
      throw new UnauthorizedException('No account');
    }

    return this.authService.getSellerMe(accountId);
  }

  @Put('seller/legal-profile')
  @UseGuards(SellerJwtAuthGuard)
  @ApiCookieAuth('sellerAccessToken')
  @ApiOperation({
    summary: 'Save seller legal data',
    description:
      'Creates or updates legal data for the current seller while it is not activated. Masked tax ID and bank account values are normalized before saving.',
  })
  @ApiOkResponse({
    type: SellerLegalProfileResponseDto,
    description: 'Seller legal profile was saved.',
  })
  @ApiResponse({
    status: 400,
    description: 'Seller is activated or legal data is invalid.',
  })
  @ApiResponse({
    status: 403,
    description: 'Seller profile not found or suspended.',
  })
  // PUT /auth/seller/legal-profile: сохраняет юридические данные продавца.
  async upsertSellerLegalProfile(
    @Req() req: Request,
    @Body() dto: SellerLegalProfileDto,
  ) {
    const accountId = (req as any).user?.sub;

    if (!accountId) {
      throw new UnauthorizedException('No account');
    }

    return this.authService.upsertSellerLegalProfile(accountId, dto);
  }

  @Post('seller/legal-profile/submit')
  @UseGuards(SellerJwtAuthGuard)
  @ApiCookieAuth('sellerAccessToken')
  @ApiOperation({
    summary: 'Submit seller legal data for review',
    description:
      'Moves seller status to UNDER_REVIEW after legal data has been filled. Rejected sellers may submit corrected legal data again.',
  })
  @ApiCreatedResponse({
    type: SellerLegalSubmitResponseDto,
    description: 'Legal data was submitted for manual review.',
  })
  @ApiResponse({
    status: 400,
    description: 'Legal data is missing or seller legal data is locked.',
  })
  @ApiResponse({
    status: 403,
    description: 'Seller profile not found or suspended.',
  })
  // POST /auth/seller/legal-profile/submit: отправляет legal data на модерацию.
  async submitSellerLegalProfile(@Req() req: Request) {
    const accountId = (req as any).user?.sub;

    if (!accountId) {
      throw new UnauthorizedException('No account');
    }

    return this.authService.submitSellerLegalProfile(accountId);
  }

  @Post('admin/login')
  @ApiOperation({
    summary: 'Login moderation admin',
    description: 'Validates admin email, password and key from environment variables.',
  })
  @ApiCreatedResponse({
    description: 'Admin login successful.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid moderation credentials.',
  })
  // POST /auth/admin/login: авторизация модератора.
  async adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto);
  }

  @Get('admin/sellers/review')
  @UseGuards(ModerationAdminGuard)
  @ApiHeader({
    name: 'x-admin-key',
    description: 'Temporary manual moderation key from MODERATION_ADMIN_KEY.',
    required: true,
  })
  @ApiOperation({
    summary: 'List sellers waiting for manual legal review',
    description:
      'Temporary manual moderation endpoint. Requires x-admin-key header matching MODERATION_ADMIN_KEY.',
  })
  @ApiOkResponse({
    type: ModerationSellerResponseDto,
    isArray: true,
    description: 'Sellers currently waiting for manual legal review.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid moderation key.',
  })
  // GET /auth/admin/sellers/review: список продавцов для ручной модерации.
  async getSellersForReview() {
    return this.authService.getSellersForReview();
  }

  @Get('admin/users/search')
  @UseGuards(ModerationAdminGuard)
  @ApiHeader({
    name: 'x-admin-key',
    description: 'Temporary manual moderation key from MODERATION_ADMIN_KEY.',
    required: true,
  })
  @ApiOperation({
    summary: 'Search users by email or phone',
  })
  // GET /auth/admin/users/search: поиск покупателей
  async searchUsers(@Req() req: Request) {
    const q = (req.query.q as string) || '';
    return this.authService.searchUsers(q);
  }

  @Get('admin/sellers/search')
  @UseGuards(ModerationAdminGuard)
  @ApiHeader({
    name: 'x-admin-key',
    description: 'Temporary manual moderation key from MODERATION_ADMIN_KEY.',
    required: true,
  })
  @ApiOperation({
    summary: 'Search sellers by store name, email, INN, or legal name',
  })
  // GET /auth/admin/sellers/search: поиск магазинов
  async searchSellers(@Req() req: Request) {
    const q = (req.query.q as string) || '';
    return this.authService.searchSellers(q);
  }

  @Post('admin/sellers/:sellerId/approve')
  @UseGuards(ModerationAdminGuard)
  @ApiHeader({
    name: 'x-admin-key',
    description: 'Temporary manual moderation key from MODERATION_ADMIN_KEY.',
    required: true,
  })
  @ApiOperation({
    summary: 'Approve seller legal review',
    description:
      'Temporary manual moderation endpoint. Requires x-admin-key header matching MODERATION_ADMIN_KEY.',
  })
  @ApiCreatedResponse({
    type: SellerProfileResponseDto,
    description: 'Seller was activated.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid moderation key.',
  })
  // POST /auth/admin/sellers/:sellerId/approve: одобряет продавца.
  async approveSeller(@Param('sellerId') sellerId: string) {
    return this.authService.approveSeller(sellerId);
  }

  @Post('admin/sellers/:sellerId/reject')
  @UseGuards(ModerationAdminGuard)
  @ApiHeader({
    name: 'x-admin-key',
    description: 'Temporary manual moderation key from MODERATION_ADMIN_KEY.',
    required: true,
  })
  @ApiOperation({
    summary: 'Reject seller legal review',
    description:
      'Temporary manual moderation endpoint. Requires x-admin-key header matching MODERATION_ADMIN_KEY.',
  })
  @ApiCreatedResponse({
    type: SellerProfileResponseDto,
    description: 'Seller was rejected with a correction comment.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid moderation key.',
  })
  // POST /auth/admin/sellers/:sellerId/reject: отклоняет продавца с комментарием.
  async rejectSeller(
    @Param('sellerId') sellerId: string,
    @Body() dto: RejectSellerDto,
  ) {
    return this.authService.rejectSeller(sellerId, dto.comment);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request buyer password reset',
    description:
      'Sends a reset code for BUYER credentials. The response is intentionally generic and does not reveal whether the email exists.',
  })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description: 'Buyer reset instructions were sent if buyer credentials exist.',
  })
  // POST /auth/forgot-password: отправляет buyer reset-код.
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('seller/forgot-password')
  @ApiOperation({
    summary: 'Request seller password reset',
    description:
      'Sends a reset code for SELLER credentials. The response is intentionally generic and does not reveal whether the email exists.',
  })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description: 'Reset instructions were sent if seller account exists.',
  })
  // POST /auth/seller/forgot-password: отправляет seller reset-код.
  async forgotSellerPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotSellerPassword(dto);
  }

  @Post('resend-verification')
  @ApiOperation({
    summary: 'Resend email verification code',
    description:
      'Generates and sends a fresh Account-level email verification code. Email verification is shared by buyer and seller profiles.',
  })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description: 'Verification code was sent if account exists.',
  })
  // POST /auth/resend-verification: повторно отправляет код подтверждения email.
  async resendVerificationCode(@Body() dto: ForgotPasswordDto) {
    return this.authService.resendVerificationCode(dto);
  }

  @Post('reset-password/verify-code')
  @ApiOperation({
    summary: 'Verify buyer password reset code',
    description:
      'Checks a buyer reset code before the user proceeds to create a new password. The code remains valid until password reset is completed or it expires.',
  })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description: 'Reset code is valid.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset code.',
  })
  // POST /auth/reset-password/verify-code: проверяет buyer reset-код.
  async verifyResetPasswordCode(@Body() dto: ResetPasswordCodeDto) {
    return this.authService.verifyResetPasswordCode(dto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset buyer password',
    description:
      'Updates the buyer password using a valid reset code and invalidates buyer refresh sessions.',
  })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description: 'Password reset successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset code.',
  })
  // POST /auth/reset-password: меняет buyer-пароль.
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('seller/reset-password/verify-code')
  @ApiOperation({
    summary: 'Verify seller password reset code',
    description:
      'Checks a seller reset code before the user proceeds to create a new password. The code remains valid until password reset is completed or it expires.',
  })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description: 'Reset code is valid.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset code.',
  })
  // POST /auth/seller/reset-password/verify-code: проверяет seller reset-код.
  async verifySellerResetPasswordCode(@Body() dto: ResetPasswordCodeDto) {
    return this.authService.verifySellerResetPasswordCode(dto);
  }

  @Post('seller/reset-password')
  @ApiOperation({
    summary: 'Reset seller password',
    description:
      'Updates the seller password using a valid seller reset code and invalidates seller refresh sessions.',
  })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description: 'Seller password reset successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset code.',
  })
  // POST /auth/seller/reset-password: меняет seller-пароль.
  async resetSellerPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetSellerPassword(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: 'Logout buyer',
    description:
      'Clears the BUYER refreshTokenHash and removes buyer auth cookies. Seller cookies and seller sessions are not touched.',
  })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description: 'Logged out successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid access token.',
  })
  // POST /auth/logout: завершает buyer-сессию и очищает buyer cookies.
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accountId = (req as any).user?.sub;

    if (accountId) {
      await this.authService.logout(accountId, CredentialScope.BUYER);
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { message: 'Logged out' };
  }

  @Post('seller/logout')
  @UseGuards(SellerJwtAuthGuard)
  @ApiCookieAuth('sellerAccessToken')
  @ApiOperation({
    summary: 'Logout seller',
    description:
      'Clears the SELLER refreshTokenHash and removes seller auth cookies. Buyer cookies and buyer sessions are not touched.',
  })
  @ApiCreatedResponse({
    type: MessageResponseDto,
    description: 'Seller logged out successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid seller access token.',
  })
  // POST /auth/seller/logout: завершает seller-сессию и очищает seller cookies.
  async sellerLogout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accountId = (req as any).user?.sub;

    if (accountId) {
      await this.authService.logout(accountId, CredentialScope.SELLER);
    }

    res.clearCookie('sellerAccessToken');
    res.clearCookie('sellerRefreshToken');

    return { message: 'Seller logged out' };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    cookieNames: { accessToken: string; refreshToken: string },
  ) {
    res.cookie(cookieNames.accessToken, accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie(cookieNames.refreshToken, refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
