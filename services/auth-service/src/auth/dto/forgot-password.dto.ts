import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'ivan@example.com',
    description:
      'Account email address. The endpoint determines whether BUYER or SELLER credentials receive the reset code.',
  })
  @IsEmail()
  email!: string;
}
