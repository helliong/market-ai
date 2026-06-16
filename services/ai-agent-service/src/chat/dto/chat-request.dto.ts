import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ChatHistoryMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'], example: 'user' })
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty({ example: 'игровая мышка до 5000' })
  @IsString()
  @MaxLength(4000)
  content!: string;
}

export class ChatConversationStateDto {
  @ApiPropertyOptional({ example: 'мышь' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  productType?: string;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPrice?: number;

  @ApiPropertyOptional({ type: [Number], example: [317] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  shownProductIds?: number[];

  @ApiPropertyOptional({ example: 'до 10к' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  lastQuery?: string;
}

export class ChatRequestDto {
  @ApiProperty({ example: 'игровая мышка до 5000' })
  @IsString()
  @MaxLength(4000)
  message!: string;

  @ApiPropertyOptional({ example: 'cmqgfwkhn0000c8iro2ild456' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Legacy body field. Prefer x-guest-id header.',
    example: 'browser-guest-id',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  guestId?: string;

  @ApiPropertyOptional({ type: [ChatHistoryMessageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryMessageDto)
  history?: ChatHistoryMessageDto[];

  @ApiPropertyOptional({ type: ChatConversationStateDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChatConversationStateDto)
  conversationState?: ChatConversationStateDto;
}
