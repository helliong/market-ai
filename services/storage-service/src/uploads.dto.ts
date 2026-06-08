import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePresignedUploadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  contentType: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  folder?: string;
}

export class DeleteObjectsDto {
  @IsString({ each: true })
  keys: string[];
}
