import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { trimString } from "../../common/transforms/trim.transform";

export class RegisterDto {
  @ApiProperty({ example: "student@example.com" })
  @IsEmail()
  @Transform(trimString)
  email: string;

  @ApiProperty({ minLength: 8, example: "StrongPass123" })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: "John" })
  @IsString()
  @IsNotEmpty()
  @Transform(trimString)
  firstName: string;

  @ApiProperty({ required: false, example: "Doe" })
  @IsOptional()
  @IsString()
  @Transform(trimString)
  lastName?: string;
}
