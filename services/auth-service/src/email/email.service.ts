import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationCode(
    email: string,
    code: string,
    purpose: 'emailVerification' | 'buyerPasswordReset' | 'sellerPasswordReset' =
      'emailVerification',
  ) {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const content = this.getCodeEmailContent(purpose);

    if (nodeEnv !== 'production') {
      this.logger.log(`${content.logLabel} for ${email}: ${code}`);
      return;
    }

    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPass = this.configService.get<string>('EMAIL_PASS');

    if (!emailUser || !emailPass) {
      throw new InternalServerErrorException(
        'Email credentials are not configured',
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.sendMail({
      from: emailUser,
      to: email,
      subject: content.subject,
      text: `${content.textLabel}: ${code}`,
      html: `
        <div>
          <h2>${content.title}</h2>
          <p>${content.textLabel}:</p>
          <strong style="font-size: 24px;">${code}</strong>
          <p>This code expires in 15 minutes.</p>
        </div>
      `,
    });
  }

  private getCodeEmailContent(
    purpose: 'emailVerification' | 'buyerPasswordReset' | 'sellerPasswordReset',
  ) {
    if (purpose === 'buyerPasswordReset') {
      return {
        logLabel: 'Buyer password reset code',
        subject: 'MarketAI buyer password reset',
        title: 'MarketAI buyer password reset',
        textLabel: 'Your buyer password reset code',
      };
    }

    if (purpose === 'sellerPasswordReset') {
      return {
        logLabel: 'Seller password reset code',
        subject: 'MarketAI seller password reset',
        title: 'MarketAI seller password reset',
        textLabel: 'Your seller password reset code',
      };
    }

    return {
      logLabel: 'Verification code',
      subject: 'MarketAI email verification',
      title: 'MarketAI email verification',
      textLabel: 'Your verification code',
    };
  }
}
