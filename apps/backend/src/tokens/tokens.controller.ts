import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ErrorCode, tokenTopUpBodySchema } from '@parton/api-contracts';
import type { Request } from 'express';

import { ApiException } from '../common/api.exception.js';
import { RequireRoles, RoleContextGuard } from '../common/role-context.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { TokensService } from './tokens.service.js';

@Controller('employers/me/tokens')
@UseGuards(RoleContextGuard)
@RequireRoles('employer', 'manager')
export class TokensController {
  constructor(private readonly tokens: TokensService) {}

  @Get()
  async balance(@Req() req: Request) {
    const employerId = req.authContext?.employerId;
    if (!employerId) {
      return successResponse(req.requestId ?? '', {
        balance: 0,
        held: 0,
        available: 0,
      });
    }
    const data = await this.tokens.getBalance(employerId);
    return successResponse(req.requestId ?? '', data);
  }

  @Post('top-ups')
  async topUp(
    @Req() req: Request,
    @Body(new ZodValidationPipe(tokenTopUpBodySchema)) body: unknown,
  ) {
    const parsed = tokenTopUpBodySchema.parse(body);
    const employerId = req.authContext?.employerId;
    if (!employerId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'İşveren bağlamı gerekli.',
      );
    }
    const idem = req.headers['idempotency-key'];
    const resolved = await this.tokens.resolveTopUpAmount(employerId, parsed);
    const data = await this.tokens.creditTopUp(
      employerId,
      resolved.total,
      typeof idem === 'string' ? idem : undefined,
      parsed.paymentOutcome,
      {
        packageId: resolved.packageId,
        bonus: resolved.bonus,
        base: resolved.base,
        userId: req.userId,
        adaptyTransactionId: parsed.adaptyTransactionId,
      },
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Get('packages')
  async packages(@Req() req: Request) {
    const data = await this.tokens.listTopUpPackages();
    return successResponse(req.requestId ?? '', data);
  }

  @Get('ledger')
  async ledger(@Req() req: Request) {
    const employerId = req.authContext?.employerId;
    if (!employerId) {
      return successResponse(req.requestId ?? '', { items: [] });
    }
    const data = await this.tokens.listLedger(employerId);
    return successResponse(req.requestId ?? '', data);
  }
}
