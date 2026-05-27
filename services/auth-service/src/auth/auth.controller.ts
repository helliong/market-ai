import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
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
  AccountSummaryResponseDto,
  BuyerProfileResponseDto,
  SellerProfileResponseDto,
  VerifyEmailDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SellerJwtAuthGuard } from './guards/seller-jwt-auth.guard';

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
  async userMe(@Req() req: Request) {
    const accountId = (req as any).user?.sub;

    if (!accountId) {
      throw new UnauthorizedException('No account');
    }

    return this.authService.getUserMe(accountId);
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
  async sellerMe(@Req() req: Request) {
    const accountId = (req as any).user?.sub;

    if (!accountId) {
      throw new UnauthorizedException('No account');
    }

    return this.authService.getSellerMe(accountId);
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
  async resendVerificationCode(@Body() dto: ForgotPasswordDto) {
    return this.authService.resendVerificationCode(dto);
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
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
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
