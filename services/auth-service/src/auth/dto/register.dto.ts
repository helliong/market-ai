import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Ivan Petrov',
    description: 'User display name',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({
    example: 'ivan@example.com',
    description: 'Buyer account email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '123456',
    description:
      'Buyer password. Seller credentials, if any, use a separate password.',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
