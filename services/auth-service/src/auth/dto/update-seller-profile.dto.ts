import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSellerProfileDto {
  @ApiProperty({ required: false, example: 'My Store' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  storeName?: string;

  @ApiProperty({ required: false, example: 'We sell good things' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ required: false, example: 'Moscow' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiProperty({ required: false, example: '+7 900 000-00-00' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ required: false, example: 'store@example.com' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  email?: string;
}
