import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ example: "currentSecret123" })
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @ApiProperty({ example: "newSecret456" })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string;
}
