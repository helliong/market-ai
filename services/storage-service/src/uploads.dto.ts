import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePresignedUploadDto {
  @ApiProperty({ example: 'products/mouse.png' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName: string;

  @ApiProperty({ example: 'image/png' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  contentType: string;

  @ApiPropertyOptional({ example: 'products' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  folder?: string;
}

export class DeleteObjectsDto {
  @ApiProperty({ type: [String], example: ['products/mouse.png'] })
  @IsString({ each: true })
  keys: string[];
}
