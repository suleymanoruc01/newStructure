import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { pushTokenRegisterBodySchema } from '@parton/api-contracts';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { NotificationsService } from './notifications.service.js';

@Controller('devices/push-tokens')
@UseGuards(JwtAuthGuard)
export class DeviceTokensController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post()
  @HttpCode(204)
  async register(
    @Req() req: Request,
    @Body(new ZodValidationPipe(pushTokenRegisterBodySchema)) body: unknown,
  ) {
    const parsed = pushTokenRegisterBodySchema.parse(body);
    await this.notifications.registerPushToken(req.userId!, parsed);
  }

  @Delete('current')
  @HttpCode(204)
  async deleteCurrent(@Req() req: Request) {
    const token = req.headers['x-device-push-token'];
    if (typeof token === 'string' && token.length > 0) {
      await this.notifications.deleteCurrentDeviceToken(req.userId!, token);
    }
  }
}
