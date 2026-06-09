import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SellerProfile = {
  accountId: string;
  storeName: string;
  status: string;
};

@Injectable()
export class AuthProfileService {
  private readonly authApiUrl: string;

  constructor(configService: ConfigService) {
    this.authApiUrl =
      configService.get<string>('AUTH_SERVICE_URL') ??
      configService.get<string>('AUTH_API_URL') ??
      'http://127.0.0.1:4001';
  }

  async getCurrentSeller(cookieHeader?: string) {
    if (!cookieHeader) {
      throw new ForbiddenException('Seller session cookie is missing');
    }

    let response: Response;

    try {
      response = await fetch(`${this.authApiUrl}/auth/seller/me`, {
        headers: {
          Cookie: cookieHeader,
        },
      });
    } catch {
      throw new ServiceUnavailableException('Auth service is unavailable');
    }

    if (response.status === 401 || response.status === 403) {
      throw new ForbiddenException('Seller profile is not available');
    }

    if (!response.ok) {
      throw new ServiceUnavailableException('Auth service request failed');
    }

    return (await response.json()) as SellerProfile;
  }
}
