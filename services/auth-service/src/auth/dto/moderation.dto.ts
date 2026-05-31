import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectSellerDto {
  @ApiProperty({ example: 'Please fix tax ID and legal address.' })
  @IsString()
  @MinLength(5)
  comment!: string;
}
