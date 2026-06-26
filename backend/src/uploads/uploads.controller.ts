import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { DeleteUploadDto } from "./dto/delete-upload.dto";
import { RequestUploadDto } from "./dto/request-upload.dto";
import { UploadsService } from "./uploads.service";

@ApiTags("Uploads")
@Controller("uploads")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("presigned-url")
  @ApiOperation({
    summary: "Get pre-signed URL for direct upload to R2",
    description:
      "Frontend then PUTs file to returned uploadUrl. " +
      "After upload completes, use publicUrl to assign to user/course/lesson.",
  })
  requestUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestUploadDto,
  ) {
    return this.uploadsService.requestUploadUrl(user.id, dto);
  }

  @Post("delete")
  // Используем POST а не DELETE — DELETE с body не везде поддерживается
  @ApiOperation({
    summary: "Delete an uploaded file by its public URL",
    description:
      "Best-effort delete. Only deletes files owned by the requesting user.",
  })
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteUploadDto,
  ) {
    await this.uploadsService.deleteByUrl(dto.publicUrl, user.id);
    return { success: true };
  }
}
