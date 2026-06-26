import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SnapshotLabel } from "@prisma/client";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

export class TakeSnapshotDto {
  @ApiProperty({ enum: SnapshotLabel, example: "PRE" })
  @IsEnum(SnapshotLabel)
  label: SnapshotLabel;

  @ApiPropertyOptional({ description: "Срез одного студента" })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: "Срез всей группы (владелец)" })
  @IsOptional()
  @IsUUID()
  groupId?: string;
}
