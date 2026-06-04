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

export const productStatuses = ['active', 'draft', 'archived'] as const;
export type ProductStatus = (typeof productStatuses)[number];

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  @Matches(/^[A-Za-zА-Яа-яЁё0-9._-]+$/)
  sku: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsString()
  category: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  price: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999999)
  stock: number;

  @IsIn(productStatuses)
  status: ProductStatus;
}
