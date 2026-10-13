import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ErrorCode,
  tokenAllocateBodySchema,
  tokenRequestApproveBodySchema,
  tokenRequestCreateBodySchema,
  tokenTopUpBodySchema,
} from '@parton/api-contracts';
import type { Request } from 'express';

import { ApiException } from '../common/api.exception.js';
import { RequireRoles, RoleContextGuard } from '../common/role-context.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { MembershipService } from '../auth/membership.service.js';
import { TokensService } from './tokens.service.js';

@Controller('employers/me/tokens')
@UseGuards(RoleContextGuard)
@RequireRoles('employer', 'manager')
export class TokensController {
  constructor(
    private readonly tokens: TokensService,
    private readonly membership: MembershipService,
  ) {}

  @Get()
  async balance(@Req() req: Request) {
    const employerId = req.authContext?.employerId;
    if (!employerId) {
      return successResponse(req.requestId ?? '', {
        balance: 0,
        held: 0,
        available: 0,
        unallocated: 0,
        workplace: 0,
        branches: [],
      });
    }
    const data = await this.tokens.getBalance(employerId, {
      ...req.authContext!,
      userId: req.userId,
    });
    return successResponse(req.requestId ?? '', data);
  }

  @Post('top-ups')
  @RequireRoles('employer', 'manager')
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
    const isManager = req.authContext?.role === 'manager';
    if (isManager) {
      await this.membership.assertPermission(
        req.userId!,
        req.authContext!,
        'tokens.purchase',
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
        creditTo: isManager ? 'workplace' : 'purse',
      },
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post('allocate')
  @RequireRoles('employer')
  async allocate(
    @Req() req: Request,
    @Body(new ZodValidationPipe(tokenAllocateBodySchema)) body: unknown,
  ) {
    const parsed = tokenAllocateBodySchema.parse(body);
    const employerId = req.authContext?.employerId;
    if (!employerId || !req.userId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'İşveren bağlamı gerekli.',
      );
    }
    const data = await this.tokens.allocate(req.userId, employerId, parsed);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('requests')
  async listRequests(@Req() req: Request) {
    const data = await this.tokens.listTokenRequests(
      req.userId!,
      req.authContext!,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post('requests')
  @RequireRoles('manager')
  async createRequest(
    @Req() req: Request,
    @Body(new ZodValidationPipe(tokenRequestCreateBodySchema)) body: unknown,
  ) {
    const parsed = tokenRequestCreateBodySchema.parse(body);
    const data = await this.tokens.createTokenRequest(
      req.userId!,
      req.authContext!,
      parsed,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post('requests/:id/approve')
  @RequireRoles('employer')
  async approveRequest(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(tokenRequestApproveBodySchema)) body: unknown,
  ) {
    const parsed = tokenRequestApproveBodySchema.parse(body);
    const data = await this.tokens.resolveTokenRequest(
      req.userId!,
      req.authContext!,
      id,
      'approve',
      parsed.amount,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post('requests/:id/reject')
  @RequireRoles('employer')
  async rejectRequest(@Req() req: Request, @Param('id') id: string) {
    const data = await this.tokens.resolveTokenRequest(
      req.userId!,
      req.authContext!,
      id,
      'reject',
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
    const data = await this.tokens.listLedger(employerId, {
      ...req.authContext!,
      userId: req.userId,
    });
    return successResponse(req.requestId ?? '', data);
  }
}
