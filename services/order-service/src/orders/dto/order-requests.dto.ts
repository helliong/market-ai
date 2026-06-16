import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutItemDto {
  @ApiProperty({ example: 317 })
  productId!: number;

  @ApiPropertyOptional({ example: 'cmq8bhu6u00025wirif3af0hf' })
  sellerId?: string;

  @ApiProperty({ example: 'Мышь A4Tech Bloody W90 Max' })
  title!: string;

  @ApiProperty({ example: '2990' })
  price!: string;

  @ApiProperty({ example: 1 })
  quantity!: number;
}

export class CheckoutCustomerDto {
  @ApiProperty({ example: 'Иван Иванов' })
  name!: string;

  @ApiProperty({ example: '+79990000000' })
  phone!: string;

  @ApiProperty({ example: 'buyer@example.com' })
  email!: string;
}

export class CheckoutDeliveryDto {
  @ApiProperty({ example: 'Москва' })
  city!: string;

  @ApiProperty({ example: 'Тверская' })
  street!: string;

  @ApiProperty({ example: '1' })
  house!: string;

  @ApiPropertyOptional({ example: '25' })
  flat?: string;

  @ApiPropertyOptional({ example: 'Позвонить за час' })
  comment?: string;

  @ApiPropertyOptional({ example: 'courier' })
  method?: string;
}

export class CheckoutPaymentDto {
  @ApiPropertyOptional({ example: 'card' })
  method?: string;
}

export class CheckoutDto {
  @ApiProperty({ type: [CheckoutItemDto] })
  items!: CheckoutItemDto[];

  @ApiProperty({ type: CheckoutCustomerDto })
  customer!: CheckoutCustomerDto;

  @ApiProperty({ type: CheckoutDeliveryDto })
  delivery!: CheckoutDeliveryDto;

  @ApiPropertyOptional({ type: CheckoutPaymentDto })
  payment?: CheckoutPaymentDto;

  @ApiPropertyOptional({
    example: 'http://127.0.0.1:3000/checkout?payment=return',
  })
  returnUrl?: string;
}

export class UpdateSellerOrderStatusDto {
  @ApiProperty({
    enum: ['completed', 'cancelled'],
    example: 'completed',
  })
  status!: string;

  @ApiPropertyOptional({ example: 'Покупатель отказался от заказа' })
  reason?: string;
}
