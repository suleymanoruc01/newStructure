import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

import { DevopsErrorsService } from '../devops/devops-errors.service.js';
import { ApiException } from './api.exception.js';
import { buildMeta } from './meta.util.js';
import { REQUEST_ID_HEADER } from './request-id.middleware.js';

@Injectable()
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(private readonly devopsErrors: DevopsErrorsService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId =
      request.requestId ??
      (typeof request.headers[REQUEST_ID_HEADER] === 'string'
        ? request.headers[REQUEST_ID_HEADER]
        : buildMeta('').requestId);

    if (exception instanceof ApiException) {
      const body = exception.getResponse();
      const payload =
        typeof body === 'object' && body !== null && 'code' in body
          ? body
          : {
              code: exception.code,
              message: exception.message,
            };
      response.status(exception.getStatus()).json({
        error: payload,
        meta: buildMeta(requestId),
      });
      return;
    }

    if (exception instanceof ZodError) {
      response.status(HttpStatus.BAD_REQUEST).json({
        error: {
          code: ErrorCode.VALIDATION_FAILED,
          message: 'Doğrulama başarısız.',
          details: exception.issues.map((issue) => ({
            path: issue.path.join('.'),
            code: issue.code,
          })),
        },
        meta: buildMeta(requestId),
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      let code: ErrorCode = ErrorCode.INTERNAL_ERROR;
      let message = 'Beklenmeyen hata.';
      if (status === HttpStatus.UNAUTHORIZED) {
        code = ErrorCode.UNAUTHORIZED;
        message = 'Yetkilendirme gerekli.';
      } else if (status === HttpStatus.FORBIDDEN) {
        code = ErrorCode.FORBIDDEN;
        message = 'Erişim reddedildi.';
      } else if (status === HttpStatus.NOT_FOUND) {
        code = ErrorCode.NOT_FOUND;
        message = 'Kayıt bulunamadı.';
      } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
        code = ErrorCode.RATE_LIMITED;
        message = 'Çok fazla istek.';
      }
      if (typeof res === 'object' && res !== null && 'message' in res) {
        const msg = (res as { message?: string | string[] }).message;
        const text = typeof msg === 'string' ? msg : Array.isArray(msg) ? msg[0] : undefined;
        // Nest's unmatched-route text is "Cannot POST /path". Keep the Turkish line.
        if (typeof text === 'string' && text.length > 0 && !text.startsWith('Cannot ')) {
          message = text;
        }
      }
      response.status(status).json({
        error: { code, message },
        meta: buildMeta(requestId),
      });
      return;
    }

    this.logger.error(exception);
    const stack =
      exception instanceof Error ? exception.stack : String(exception);
    void this.devopsErrors
      .captureServerError({
        app: 'api',
        message: exception instanceof Error ? exception.message : String(exception),
        stack,
        requestId,
      })
      .catch((error) => {
        this.logger.warn(
          `DevOps capture failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      });

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Sunucu hatası.',
      },
      meta: buildMeta(requestId),
    });
  }
}
