import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { Agent } from 'node:https';
import { firstValueFrom } from 'rxjs';
import type {
  ChatMessage,
  GigaChatFunction,
  GigaChatResponse,
} from './chat.types';

type TokenResponse = {
  access_token: string;
  expires_at?: number;
};

@Injectable()
export class GigaChatProvider {
  private accessToken?: string;
  private accessTokenExpiresAt = 0;
  private readonly httpsAgent: Agent;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.httpsAgent = new Agent({
      rejectUnauthorized:
        configService.get<string>('GIGACHAT_TLS_REJECT_UNAUTHORIZED') !==
        'false',
    });
  }

  async complete(
    messages: ChatMessage[],
    functions: GigaChatFunction[],
  ): Promise<GigaChatResponse> {
    const token = await this.getAccessToken();
    const baseUrl =
      this.configService.get<string>('GIGACHAT_API_URL') ??
      'https://gigachat.devices.sberbank.ru/api/v1';

    try {
      const response = await firstValueFrom(
        this.httpService.post<GigaChatResponse>(
          `${baseUrl}/chat/completions`,
          {
            model:
              this.configService.get<string>('GIGACHAT_MODEL') ?? 'GigaChat-2',
            messages,
            functions,
            function_call: 'auto',
            temperature: 0.2,
          },
          {
            httpsAgent: this.httpsAgent,
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch {
      throw new ServiceUnavailableException(
        'GigaChat временно недоступен. Попробуйте ещё раз позже.',
      );
    }
  }

  private async getAccessToken() {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt - 60_000) {
      return this.accessToken;
    }

    const authKey = this.configService.get<string>('GIGACHAT_AUTH_KEY');

    if (!authKey) {
      throw new ServiceUnavailableException(
        'GigaChat authorization key is not configured',
      );
    }

    const scope =
      this.configService.get<string>('GIGACHAT_SCOPE') ?? 'GIGACHAT_API_PERS';
    const body = new URLSearchParams({ scope });

    try {
      const response = await firstValueFrom(
        this.httpService.post<TokenResponse>(
          'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
          body.toString(),
          {
            httpsAgent: this.httpsAgent,
            headers: {
              Accept: 'application/json',
              Authorization: `Basic ${authKey.replace(/^Basic\s+/i, '')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
              RqUID: randomUUID(),
            },
          },
        ),
      );

      this.accessToken = response.data.access_token;
      this.accessTokenExpiresAt =
        normalizeExpiration(response.data.expires_at) ??
        Date.now() + 30 * 60_000;

      return this.accessToken;
    } catch (error) {
      if (isTlsCertificateError(error)) {
        throw new ServiceUnavailableException(
          'Не удалось проверить TLS-сертификат GigaChat. Настройте доверенный сертификат или GIGACHAT_TLS_REJECT_UNAUTHORIZED=false для локальной разработки.',
        );
      }

      throw new UnauthorizedException(
        'Не удалось авторизоваться в GigaChat. Проверьте ключ.',
      );
    }
  }
}

function isTlsCertificateError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? String(error.code) : '';
  return [
    'CERT_HAS_EXPIRED',
    'DEPTH_ZERO_SELF_SIGNED_CERT',
    'SELF_SIGNED_CERT_IN_CHAIN',
    'UNABLE_TO_GET_ISSUER_CERT',
    'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
    'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  ].includes(code);
}

function normalizeExpiration(value?: number) {
  if (!value) {
    return undefined;
  }

  return value > 10_000_000_000 ? value : value * 1000;
}
