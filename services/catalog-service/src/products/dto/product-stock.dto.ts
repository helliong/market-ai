import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';

export class ProductStockItemDto {
  @ApiProperty({ example: 317 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class ProductStockMutationDto {
  @ApiProperty({ type: [ProductStockItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductStockItemDto)
  items: ProductStockItemDto[];
}
