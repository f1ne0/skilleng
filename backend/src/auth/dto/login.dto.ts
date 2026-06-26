import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsString, MinLength } from "class-validator";
import { trimString } from "../../common/transforms/trim.transform";

export class LoginDto {
  @ApiProperty({ example: "student@example.com" })
  @IsEmail()
  @Transform(trimString)
  email: string;

  @ApiProperty({ example: "StrongPass123" })
  @IsString()
  @MinLength(8)
  password: string;
}
