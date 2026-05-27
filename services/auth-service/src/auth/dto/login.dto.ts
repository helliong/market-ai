import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'ivan@example.com',
    description:
      'Account email address. The endpoint determines whether BUYER or SELLER credentials are checked.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '123456',
    description:
      'Scoped password for the selected endpoint: buyer password for /auth/login, seller password for /auth/seller/login.',
  })
  @IsString()
  password!: string;
}
