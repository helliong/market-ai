import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'ivan@example.com',
    description: 'Account email address',
  })
  @IsEmail()
  email!: string;
}