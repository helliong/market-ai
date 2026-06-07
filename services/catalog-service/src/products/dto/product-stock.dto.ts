import { Type } from 'class-transformer';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';

export class ProductStockItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class ProductStockMutationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductStockItemDto)
  items: ProductStockItemDto[];
}
