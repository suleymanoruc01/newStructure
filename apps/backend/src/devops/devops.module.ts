import { Module } from '@nestjs/common';

import { AdminGuardsModule } from '../admin/admin-guards.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { TokensModule } from '../tokens/tokens.module.js';
import { DevopsController } from './devops.controller.js';
import { DevopsErrorsService } from './devops-errors.service.js';
import { DevopsReleasesService } from './devops-releases.service.js';
import { DevopsServicesService } from './devops-services.service.js';

@Module({
  imports: [AdminGuardsModule, AuthModule, StorageModule, TokensModule],
  controllers: [DevopsController],
  providers: [
    DevopsErrorsService,
    DevopsReleasesService,
    DevopsServicesService,
  ],
  exports: [DevopsErrorsService],
})
export class DevopsModule {}
