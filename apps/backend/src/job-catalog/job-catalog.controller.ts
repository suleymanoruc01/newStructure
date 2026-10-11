import { Controller, Get, Req } from '@nestjs/common';

import { successResponse } from '../common/response.util.js';
import type { Request } from 'express';
import { JobCatalogService } from './job-catalog.service.js';

@Controller('job-catalog')
export class JobCatalogController {
  constructor(private readonly catalog: JobCatalogService) {}

  @Get()
  async list(@Req() req: Request) {
    const data = await this.catalog.listActive();
    return successResponse(req.requestId ?? '', data);
  }
}
