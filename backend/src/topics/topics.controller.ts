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
import { Role } from "@prisma/client";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateTopicDto } from "./dto/create-topic.dto";
import { ListTopicsDto } from "./dto/list-topics.dto";
import { UpdateTopicDto } from "./dto/update-topic.dto";
import { TopicsService } from "./topics.service";

@ApiTags("Topics")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("topics")
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @ApiOperation({ summary: "Каталог тем (фильтры по навыку и уровню)" })
  findAll(@Query() query: ListTopicsDto) {
    return this.topicsService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Тема: теория + связанные уроки-тренажёры" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.topicsService.findOne(id);
  }

  @Post()
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Создать тему (teacher)" })
  create(@Body() dto: CreateTopicDto) {
    return this.topicsService.create(dto);
  }

  @Patch(":id")
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Редактировать тему (teacher)" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.topicsService.update(id, dto);
  }

  @Delete(":id")
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Удалить тему (уроки отвязываются, не удаляются)" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.topicsService.remove(id);
  }
}
