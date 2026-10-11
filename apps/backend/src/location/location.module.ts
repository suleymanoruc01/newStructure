import { Module } from '@nestjs/common';

import { AppConfigModule } from '../config/app-config.module.js';
import { GeofenceService } from './geofence.service.js';

@Module({
  imports: [AppConfigModule],
  providers: [GeofenceService],
  exports: [GeofenceService],
})
export class LocationModule {}
