import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { notificationPreferencesPatchSchema } from '@parton/api-contracts';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { successResponse } from '../common/response.util.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async list(@Req() req: Request, @Query('limit') limitRaw?: string) {
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;
    const data = await this.notifications.listInbox(req.userId!, limit);
    return successResponse(req.requestId ?? '', data);
  }

  @Get('preferences')
  async getPreferences(@Req() req: Request) {
    const data = await this.notifications.getPreferences(req.userId!);
    return successResponse(req.requestId ?? '', data);
  }

  @Patch('preferences')
  async patchPreferences(
    @Req() req: Request,
    @Body(new ZodValidationPipe(notificationPreferencesPatchSchema))
    body: unknown,
  ) {
    const parsed = notificationPreferencesPatchSchema.parse(body);
    const data = await this.notifications.patchPreferences(
      req.userId!,
      parsed,
    );
    return successResponse(req.requestId ?? '', data);
  }

  @Post('read-all')
  async markAllRead(@Req() req: Request) {
    await this.notifications.markAllRead(req.userId!);
    return successResponse(req.requestId ?? '', { ok: true });
  }

  @Get(':id')
  async getOne(@Req() req: Request, @Param('id') id: string) {
    const data = await this.notifications.getOne(req.userId!, id);
    return successResponse(req.requestId ?? '', data);
  }

  @Post(':id/read')
  async markRead(@Req() req: Request, @Param('id') id: string) {
    const data = await this.notifications.markRead(req.userId!, id);
    return successResponse(req.requestId ?? '', data);
  }
}
