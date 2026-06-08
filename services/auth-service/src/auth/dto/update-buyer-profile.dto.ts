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

  @ApiPropertyOptional({
    example: '1990-01-01T00:00:00.000Z',
    description: 'Buyer birth date',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiPropertyOptional({
    example: 'male',
    description: 'Buyer gender',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    example: 'data:image/png;base64,...',
    description: 'Base64 encoded avatar image',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'Екатеринбург', nullable: true })
  @IsOptional()
  @IsString()
  deliveryCity?: string | null;

  @ApiPropertyOptional({ example: 'Ленина', nullable: true })
  @IsOptional()
  @IsString()
  deliveryStreet?: string | null;

  @ApiPropertyOptional({ example: '10', nullable: true })
  @IsOptional()
  @IsString()
  deliveryHouse?: string | null;

  @ApiPropertyOptional({ example: '24', nullable: true })
  @IsOptional()
  @IsString()
  deliveryFlat?: string | null;

  @ApiPropertyOptional({
    example: 'Подъезд 2, домофон 24',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  deliveryComment?: string | null;
}
