import { PartialType } from "@nestjs/swagger";

import { CreateCourseDto } from "./create-course.dto";

// PartialType из @nestjs/swagger делает ВСЕ поля CreateCourseDto опциональными
// и автоматом наследует @ApiProperty, @IsString и т.д.
// Это PATCH-DTO одной строкой — никаких дубликатов.
export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
