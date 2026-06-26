import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";
import { Transform } from "class-transformer";
import { trimString } from "../../common/transforms/trim.transform";

export class JoinGroupDto {
  @ApiProperty({ example: "ABC234", minLength: 6, maxLength: 6 })
  @IsString()
  @Length(6, 6)
  @Transform(trimString)
  // приводим к верхнему регистру — юзер мог ввести строчными
  inviteCode: string;
}
