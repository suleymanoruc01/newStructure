import { Module } from '@nestjs/common';

import { JobCatalogController } from './job-catalog.controller.js';
import { JobCatalogService } from './job-catalog.service.js';

@Module({
  controllers: [JobCatalogController],
  providers: [JobCatalogService],
  exports: [JobCatalogService],
})
export class JobCatalogModule {}
