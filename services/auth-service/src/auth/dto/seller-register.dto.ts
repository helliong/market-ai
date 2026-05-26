import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class SellerRegisterDto {
  @ApiProperty({
    example: 'seller@example.com',
    description: 'Seller account email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '123456',
    description: 'Account password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    example: 'Ivan Store',
    description: 'Seller store name',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  storeName!: string;

  @ApiProperty({
    example: true,
    description: 'Whether seller accepted the seller agreement',
  })
  @IsBoolean()
  agreementAccepted!: boolean;

  @ApiPropertyOptional({
    example: 'Ivan Petrov',
    description: 'Seller legal name',
  })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Seller INN',
  })
  @IsOptional()
  @IsString()
  inn?: string;

  @ApiPropertyOptional({
    example: '+79991234567',
    description: 'Seller phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}