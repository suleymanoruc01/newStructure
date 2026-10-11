import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

import { successResponse } from '../common/response.util.js';
import { PlatformService } from './platform.service.js';

@Controller('platform')
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get('remote-config')
  async remoteConfig(@Req() req: Request) {
    const data = await this.platform.getPublicRemoteConfig();
    return successResponse(req.requestId ?? '', data);
  }
}
