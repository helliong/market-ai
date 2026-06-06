import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectSellerDto {
  @ApiProperty({ example: 'Please fix tax ID and legal address.' })
  @IsString()
  @MinLength(5)
  comment!: string;
}
export class AdminLoginDto {
  @ApiProperty({ example: 'admin@market.ai' })
  @IsString()
  email!: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  password!: string;

  @ApiProperty({ example: 'modkey123' })
  @IsString()
  adminKey!: string;
}
