import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'ivan@example.com',
    description:
      'Account email address. The endpoint determines whether BUYER or SELLER credentials are reset.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '123456',
    description: 'Six-digit reset code',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  code!: string;

  @ApiProperty({
    example: 'new-password-123',
    description:
      'New scoped password for the selected endpoint: buyer password for /auth/reset-password, seller password for /auth/seller/reset-password.',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
