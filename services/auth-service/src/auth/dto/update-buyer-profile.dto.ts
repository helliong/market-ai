import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateBuyerProfileDto {
  @ApiPropertyOptional({
    example: 'Ivan Petrov',
    description: 'Buyer display name',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  displayName?: string;

  @ApiPropertyOptional({
    example: 'buyer@example.com',
    description: 'Buyer account email. Shared account email is updated as well.',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '+79991234567',
    description:
      'Buyer phone number. Any common human-readable formatting is accepted.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
