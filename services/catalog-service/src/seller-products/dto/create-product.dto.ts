import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const productStatuses = ['active', 'draft', 'archived'] as const;
export type ProductStatus = (typeof productStatuses)[number];

export class CreateProductDto {
  @ApiProperty({
    example: 'SKU-001',
    description:
      'Unique seller SKU. Letters, digits, dots, underscores and hyphens are allowed.',
    minLength: 2,
    maxLength: 64,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  @Matches(/^[A-Za-zА-Яа-яЁё0-9._-]+$/)
  sku: string;

  @ApiProperty({ example: 'Wireless keyboard', minLength: 2, maxLength: 160 })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional({
    example: 'Compact keyboard with silent switches.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'electronics' })
  @IsString()
  category: string;

  @ApiProperty({ example: 2499.99, minimum: 1 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  price: number;

  @ApiProperty({ example: 25, minimum: 0, maximum: 999999 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999999)
  stock: number;

  @ApiProperty({ example: 'active', enum: productStatuses })
  @IsIn(productStatuses)
  status: ProductStatus;
}
