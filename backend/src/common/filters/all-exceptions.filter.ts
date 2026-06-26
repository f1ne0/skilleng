import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Определяем статус и сообщение
    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // ← ДОБАВЬ: логируем код и метаданные Prisma-ошибки
      this.logger.error(
        `Prisma error ${exception.code}: ${exception.message}`,
        exception.meta,
      );

      switch (exception.code) {
        case "P2002":
          status = HttpStatus.CONFLICT;
          message = "A record with this value already exists";
          break;
        case "P2025":
          status = HttpStatus.NOT_FOUND;
          message = "Record not found";
          break;
        case "P2021":
          // ← ДОБАВЬ обработку "таблица не существует"
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = "Database table not found — migration may be missing";
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = `Database error (${exception.code})`;
        // показываем код ошибки — легче дебажить
      }
    }

    // Логируем серверные ошибки с полным stack
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : exception,
      );
    } else if (status >= 400) {
      // 4xx — не наша вина, логируем без stack
      this.logger.warn(`${request.method} ${request.url} - ${status}`);
    }

    const finalMessage =
      typeof message === "string"
        ? message
        : ((message as { message?: string | string[] }).message ?? message);

    response.status(status).json({
      statusCode: status,
      message: finalMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
