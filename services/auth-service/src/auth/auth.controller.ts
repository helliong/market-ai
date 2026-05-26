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
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SellerRegisterDto,
  VerifyEmailDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Throttle({ default: { limit: 5, ttl: 60000 } })
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a buyer profile' })
  @ApiResponse({
    status: 201,
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
  @ApiOperation({ summary: 'Register a seller profile' })
  @ApiResponse({
    status: 201,
    description: 'Seller registered. Verification code was sent to email.',
  })
  @ApiResponse({
    status: 409,
    description: 'Seller profile already exists.',
  })
  async registerSeller(@Body() dto: SellerRegisterDto) {
    return this.authService.registerSeller(dto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify account email with six-digit code' })
  @ApiResponse({
    status: 201,
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
  @ApiOperation({ summary: 'Login and set auth cookies' })
  @ApiResponse({
    status: 201,
    description: 'Login successful. Sets accessToken and refreshToken cookies.',
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
    this.setAuthCookies(res, accessToken, refreshToken);

    return { message: 'Login successful' };
  }

  @Post('seller/login')
  @ApiOperation({ summary: 'Seller login and set auth cookies' })
  @ApiResponse({
    status: 201,
    description:
      'Seller login successful. Sets accessToken and refreshToken cookies.',
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
    this.setAuthCookies(res, accessToken, refreshToken);

    return { message: 'Seller login successful' };
  }

  @Post('refresh')
  @ApiCookieAuth('refreshToken')
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({
    status: 201,
    description:
      'Tokens refreshed. Sets new accessToken and refreshToken cookies.',
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
      await this.authService.refreshTokens(refreshToken);

    this.setAuthCookies(res, accessToken, newRefreshToken);

    return { message: 'Tokens refreshed' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get current account summary' })
  @ApiResponse({
    status: 200,
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
  @ApiOperation({ summary: 'Get current buyer profile' })
  @ApiResponse({
    status: 200,
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
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get current seller profile' })
  @ApiResponse({
    status: 200,
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
  @ApiOperation({ summary: 'Request password reset code' })
  @ApiResponse({
    status: 201,
    description: 'Reset instructions were sent if account exists.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Request a new email verification code' })
  @ApiResponse({
    status: 201,
    description: 'Verification code was sent if account exists.',
  })
  async resendVerificationCode(@Body() dto: ForgotPasswordDto) {
    return this.authService.resendVerificationCode(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset account password' })
  @ApiResponse({
    status: 201,
    description: 'Password reset successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset code.',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Logout and clear auth cookies' })
  @ApiResponse({
    status: 201,
    description: 'Logged out successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid access token.',
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accountId = (req as any).user?.sub;

    if (accountId) {
      await this.authService.logout(accountId);
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return { message: 'Logged out' };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
