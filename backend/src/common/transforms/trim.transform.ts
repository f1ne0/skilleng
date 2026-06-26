import type { TransformFnParams } from "class-transformer";

/**
 * Trim строки. Используется в DTO с @Transform для нормализации входа.
 * Если поле не string — возвращает как есть, не падает.
 */
export const trimString = ({ value }: TransformFnParams): unknown =>
  typeof value === "string" ? value.trim() : value;
