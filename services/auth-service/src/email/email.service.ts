import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationCode(email: string, code: string) {
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    if (nodeEnv !== 'production') {
      this.logger.log(`Verification code for ${email}: ${code}`);
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
      subject: 'MarketAI email verification',
      text: `Your verification code is: ${code}`,
      html: `
        <div>
          <h2>MarketAI email verification</h2>
          <p>Your verification code:</p>
          <strong style="font-size: 24px;">${code}</strong>
          <p>This code expires in 15 minutes.</p>
        </div>
      `,
    });
  }
}