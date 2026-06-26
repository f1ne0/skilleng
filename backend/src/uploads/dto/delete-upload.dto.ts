import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUrl } from "class-validator";

export class DeleteUploadDto {
  @ApiProperty({
    description: "Public URL of file to delete",
    example: "https://pub-xxx.r2.dev/avatars/userId/abc.jpg",
  })
  @IsString()
  @IsUrl()
  publicUrl: string;
}
