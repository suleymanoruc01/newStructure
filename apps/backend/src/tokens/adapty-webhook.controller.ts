import { Body, Controller, Headers, HttpStatus, Post, Req } from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';
import type { Request } from 'express';

import { ApiException } from '../common/api.exception.js';
import { successResponse } from '../common/response.util.js';
import { AdaptyService } from './adapty.service.js';
import { TokensService } from './tokens.service.js';

@Controller('webhooks/adapty')
export class AdaptyWebhookController {
  constructor(
    private readonly adapty: AdaptyService,
    private readonly tokens: TokensService,
  ) {}

  @Post()
  async receive(
    @Req() req: Request,
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const settings = await this.adapty.loadSettings();
    if (
      !this.adapty.webhookAuthorized(
        authorization,
        settings.webhookAuthorization,
      )
    ) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
        'Webhook yetkisi geçersiz.',
      );
    }
    if (
      body &&
      typeof body === 'object' &&
      !Array.isArray(body) &&
      Object.keys(body as object).length === 0
    ) {
      return successResponse(req.requestId ?? '', { ok: true as const });
    }
    await this.tokens.applyAdaptyWebhook(body);
    return successResponse(req.requestId ?? '', { ok: true as const });
  }
}
