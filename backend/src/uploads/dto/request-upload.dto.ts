import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

import { UploadPurpose } from "../upload-config";

export class RequestUploadDto {
  @ApiProperty({
    description: "Original filename (for display only)",
    example: "my-avatar.jpg",
    maxLength: 255,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  filename: string;

  @ApiProperty({
    description: "MIME type — must match purpose's whitelist",
    example: "image/jpeg",
  })
  @IsString()
  @MaxLength(100)
  mimeType: string;

  @ApiProperty({
    description: "File size in bytes — checked against purpose's limit",
    minimum: 1,
    maximum: 500 * 1024 * 1024,
  })
  @IsInt()
  @Min(1)
  @Max(500 * 1024 * 1024)
  // абсолютный максимум на DTO-уровне; per-purpose лимит ниже
  sizeBytes: number;

  @ApiProperty({ enum: UploadPurpose })
  @IsEnum(UploadPurpose)
  purpose: UploadPurpose;
}
