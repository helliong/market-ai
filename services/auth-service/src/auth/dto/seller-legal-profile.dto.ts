import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MinLength } from 'class-validator';

export class SellerLegalProfileDto {
  @ApiProperty({
    example: 'individual',
    enum: ['individual', 'company', 'selfEmployed'],
  })
  @IsString()
  @IsIn(['individual', 'company', 'selfEmployed'])
  businessType!: string;

  @ApiProperty({ example: '123456789012' })
  @IsString()
  @MinLength(4)
  taxId!: string;

  @ApiProperty({ example: 'IP MarketAI Store' })
  @IsString()
  @MinLength(2)
  legalName!: string;

  @ApiProperty({ example: 'Yekaterinburg, Lenina 1' })
  @IsString()
  @MinLength(5)
  legalAddress!: string;

  @ApiProperty({ example: 'MarketAI Bank' })
  @IsString()
  @MinLength(2)
  bankName!: string;

  @ApiProperty({
    example: 'KZ000000000000000000',
    description:
      'Bank account or IBAN. The service normalizes spaces and uppercases letters.',
  })
  @IsString()
  @MinLength(8)
  iban!: string;
}
