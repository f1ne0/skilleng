import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { CreateVocabularyEntryDto } from "./dto/create-entry.dto";
import { ListEntriesDto } from "./dto/list-entries.dto";
import { ReviewEntryDto } from "./dto/review-entry.dto";
import { UpdateVocabularyEntryDto } from "./dto/update-entry.dto";
import { VocabularyService } from "./vocabulary.service";

@ApiTags("Vocabulary")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("vocabulary")
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  // ВАЖНО: статические маршруты (stats, review/due) объявлены ДО ":id",
  // иначе Nest сматчит "stats" как :id

  @Get("stats")
  @ApiOperation({ summary: "Всего / выучено / к повтору" })
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.vocabularyService.stats(user.id);
  }

  @Get("review/due")
  @ApiOperation({ summary: "Слова к повтору (dueAt <= now)" })
  findDue(@CurrentUser() user: AuthenticatedUser) {
    return this.vocabularyService.findDue(user.id);
  }

  @Post("review/:id")
  @ApiOperation({ summary: "Результат повтора слова (SM-2)" })
  review(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ReviewEntryDto,
  ) {
    return this.vocabularyService.review(user.id, id, dto.quality);
  }

  @Post()
  @ApiOperation({ summary: "Добавить слово в личный словарь" })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateVocabularyEntryDto,
  ) {
    return this.vocabularyService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "Список слов (пагинация, поиск)" })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListEntriesDto,
  ) {
    return this.vocabularyService.findAll(user.id, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Одно слово" })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.vocabularyService.findOne(user.id, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Редактировать слово" })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateVocabularyEntryDto,
  ) {
    return this.vocabularyService.update(user.id, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Удалить слово" })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.vocabularyService.remove(user.id, id);
  }
}
