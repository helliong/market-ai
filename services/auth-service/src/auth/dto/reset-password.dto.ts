import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'ivan@example.com',
    description: 'Account email address',
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
    description: 'New account password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}