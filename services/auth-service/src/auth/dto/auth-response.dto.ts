import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: 'Operation completed successfully' })
  message!: string;
}

export class AccountSummaryResponseDto {
  @ApiProperty({ example: 'clxaccount123' })
  id!: string;

  @ApiProperty({ example: 'buyer@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'Ivan Petrov', nullable: true })
  name!: string | null;

  @ApiPropertyOptional({ example: 'Ivan Petrov', nullable: true })
  displayName!: string | null;

  @ApiProperty({ example: true })
  isEmailVerified!: boolean;

  @ApiProperty({ example: true })
  hasUserProfile!: boolean;

  @ApiProperty({ example: false })
  hasSellerProfile!: boolean;

  @ApiPropertyOptional({
    example: 'PENDING_LEGAL_DATA',
    enum: [
      'PENDING_LEGAL_DATA',
      'UNDER_REVIEW',
      'ACTIVATED',
      'SUSPENDED',
      'REJECTED',
    ],
    nullable: true,
  })
  sellerStatus!: string | null;

  @ApiProperty({ example: '2026-05-26T17:05:08.200Z' })
  createdAt!: Date;
}

export class BuyerProfileResponseDto {
  @ApiProperty({ example: 'clxbuyer123' })
  id!: string;

  @ApiProperty({ example: 'clxaccount123' })
  accountId!: string;

  @ApiProperty({ example: 'Ivan Petrov' })
  displayName!: string;

  @ApiProperty({ example: '2026-05-26T17:05:08.200Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-26T17:05:08.200Z' })
  updatedAt!: Date;
}

export class SellerLegalProfileResponseDto {
  @ApiProperty({ example: 'clxlegal123' })
  id!: string;

  @ApiProperty({ example: 'clxseller123' })
  sellerId!: string;

  @ApiProperty({
    example: 'individual',
    enum: ['individual', 'company', 'selfEmployed'],
  })
  businessType!: string;

  @ApiProperty({
    example: '123456789012',
    description: 'Normalized INN/BIN/tax identifier. Formatting spaces are removed.',
  })
  taxId!: string;

  @ApiProperty({ example: 'IP MarketAI Store' })
  legalName!: string;

  @ApiProperty({ example: 'Yekaterinburg, Lenina 1' })
  legalAddress!: string;

  @ApiProperty({ example: 'MarketAI Bank' })
  bankName!: string;

  @ApiProperty({
    example: 'KZ000000000000000000',
    description: 'Normalized bank account or IBAN. Spaces are removed and letters are uppercased.',
  })
  iban!: string;

  @ApiProperty({ example: '2026-05-26T17:05:08.200Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-26T17:05:08.200Z' })
  updatedAt!: Date;
}

export class SellerLegalSubmitResponseDto extends MessageResponseDto {
  @ApiProperty({ example: 'UNDER_REVIEW', enum: ['UNDER_REVIEW'] })
  status!: string;
}

export class SellerProfileResponseDto {
  @ApiProperty({ example: 'clxseller123' })
  id!: string;

  @ApiProperty({ example: 'clxaccount123' })
  accountId!: string;

  @ApiProperty({ example: 'Ivan Store' })
  storeName!: string;

  @ApiProperty({
    example: 'PENDING_LEGAL_DATA',
    enum: [
      'PENDING_LEGAL_DATA',
      'UNDER_REVIEW',
      'ACTIVATED',
      'SUSPENDED',
      'REJECTED',
    ],
  })
  status!: string;

  @ApiProperty({ example: 'seller@example.com' })
  ownerEmail!: string;

  @ApiProperty({ example: 'Ivan Store' })
  ownerName!: string;

  @ApiPropertyOptional({ example: 'Fix tax ID', nullable: true })
  reviewComment!: string | null;

  @ApiPropertyOptional({
    example: '2026-05-26T17:05:08.200Z',
    nullable: true,
  })
  submittedAt!: Date | null;

  @ApiPropertyOptional({
    example: '2026-05-26T17:05:08.200Z',
    nullable: true,
  })
  reviewedAt!: Date | null;

  @ApiProperty({ example: '2026-05-26T17:05:08.200Z' })
  agreementAcceptedAt!: Date;

  @ApiPropertyOptional({ example: 'Ivan Petrov', nullable: true })
  legalName!: string | null;

  @ApiPropertyOptional({ example: '1234567890', nullable: true })
  inn!: string | null;

  @ApiPropertyOptional({ example: '+79991234567', nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({
    type: SellerLegalProfileResponseDto,
    nullable: true,
  })
  legalProfile!: SellerLegalProfileResponseDto | null;

  @ApiProperty({ example: '2026-05-26T17:05:08.200Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-26T17:05:08.200Z' })
  updatedAt!: Date;
}

export class ModerationSellerAccountResponseDto {
  @ApiProperty({ example: 'seller@example.com' })
  email!: string;

  @ApiProperty({ example: true })
  isEmailVerified!: boolean;
}

export class ModerationSellerResponseDto extends SellerProfileResponseDto {
  @ApiProperty({ type: ModerationSellerAccountResponseDto })
  account!: ModerationSellerAccountResponseDto;
}
