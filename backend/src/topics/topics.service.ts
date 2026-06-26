import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateTopicDto } from "./dto/create-topic.dto";
import { ListTopicsDto } from "./dto/list-topics.dto";
import { UpdateTopicDto } from "./dto/update-topic.dto";

// Превью темы в каталоге — без тяжёлого theoryContent
const TOPIC_LIST_SELECT = {
  id: true,
  title: true,
  skill: true,
  level: true,
  order: true,
  _count: { select: { lessons: true } },
} satisfies Prisma.TopicSelect;

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  // ========== CATALOG ==========
  async findAll(query: ListTopicsDto) {
    const topics = await this.prisma.topic.findMany({
      where: {
        ...(query.skill && { skill: query.skill }),
        ...(query.level && { level: query.level }),
      },
      select: TOPIC_LIST_SELECT,
      orderBy: [{ skill: "asc" }, { level: "asc" }, { order: "asc" }],
    });

    return topics.map((t) => ({
      id: t.id,
      title: t.title,
      skill: t.skill,
      level: t.level,
      order: t.order,
      lessonCount: t._count.lessons,
    }));
  }

  // ========== DETAIL: теория + связанные уроки-тренажёры ==========
  async findOne(id: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        lessons: {
          // студенту — только опубликованные тренажёры
          where: { status: "PUBLISHED" },
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            durationSec: true,
            isPreview: true,
            skillFocus: true,
            course: { select: { id: true, slug: true, title: true } },
          },
        },
      },
    });
    if (!topic) throw new NotFoundException("Topic not found");
    return topic;
  }

  // ========== CRUD (teacher) ==========
  async create(dto: CreateTopicDto) {
    return this.prisma.topic.create({
      data: {
        title: dto.title.trim(),
        skill: dto.skill,
        level: dto.level,
        theoryContent: dto.theoryContent,
        order: dto.order ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateTopicDto) {
    await this.assertExists(id);
    return this.prisma.topic.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.skill !== undefined && { skill: dto.skill }),
        ...(dto.level !== undefined && { level: dto.level }),
        ...(dto.theoryContent !== undefined && {
          theoryContent: dto.theoryContent,
        }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });
  }

  async remove(id: string) {
    await this.assertExists(id);
    // уроки не удаляются: FK SetNull отвяжет их от темы
    await this.prisma.topic.delete({ where: { id } });
    return { success: true };
  }

  private async assertExists(id: string): Promise<void> {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!topic) throw new NotFoundException("Topic not found");
  }
}
