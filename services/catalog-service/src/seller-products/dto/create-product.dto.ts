import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
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
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const productStatuses = ['active', 'draft', 'archived'] as const;
export type ProductStatus = (typeof productStatuses)[number];

export class ProductImageDto {
  @ApiProperty({ example: 'https://cdn.example.com/products/sku-001/1.webp' })
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  url: string;

  @ApiProperty({ example: true, default: false })
  @IsBoolean()
  isMain: boolean;

  @ApiProperty({ example: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class CreateProductDto {
  @ApiProperty({
    example: 'SKU-001',
    description:
      'Unique seller SKU. Letters, digits, dots, underscores and hyphens are allowed.',
    minLength: 2,
    maxLength: 20,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  @Matches(/^[A-Za-zА-Яа-яЁё0-9._-]+$/)
  sku: string;

  @ApiProperty({ example: 'Wireless keyboard', minLength: 2, maxLength: 60 })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
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

  @ApiPropertyOptional({ type: [ProductImageDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];
}
