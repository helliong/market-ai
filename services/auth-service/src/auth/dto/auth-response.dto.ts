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
    example: 'PENDING',
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'],
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

export class SellerProfileResponseDto {
  @ApiProperty({ example: 'clxseller123' })
  id!: string;

  @ApiProperty({ example: 'clxaccount123' })
  accountId!: string;

  @ApiProperty({ example: 'Ivan Store' })
  storeName!: string;

  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'],
  })
  status!: string;

  @ApiProperty({ example: '2026-05-26T17:05:08.200Z' })
  agreementAcceptedAt!: Date;

  @ApiPropertyOptional({ example: 'Ivan Petrov', nullable: true })
  legalName!: string | null;

  @ApiPropertyOptional({ example: '1234567890', nullable: true })
  inn!: string | null;

  @ApiPropertyOptional({ example: '+79991234567', nullable: true })
  phone!: string | null;

  @ApiProperty({ example: '2026-05-26T17:05:08.200Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-26T17:05:08.200Z' })
  updatedAt!: Date;
}
