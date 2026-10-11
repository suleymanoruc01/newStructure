import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@parton/api-contracts';

export class ApiException extends HttpException {
  readonly code: ErrorCode;

  constructor(
    status: HttpStatus,
    code: ErrorCode,
    message: string,
    details?: {
      path?: string;
      code: string;
      jobId?: string;
      startsAt?: string;
      endsAt?: string;
    }[],
  ) {
    super({ code, message, details }, status);
    this.code = code;
  }
}
