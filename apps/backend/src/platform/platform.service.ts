import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicRemoteConfig() {
    const row = await this.prisma.remoteConfig.findUnique({
      where: { id: 'default' },
    });
    if (!row) {
      return {
        maintenanceMode: false,
        minMobileIosVersion: null,
        minMobileAndroidVersion: null,
        geofenceRadiusM: 100,
        geofenceSoftRadiusM: 150,
      };
    }
    return {
      maintenanceMode: row.maintenanceMode,
      minMobileIosVersion: row.minMobileIosVersion,
      minMobileAndroidVersion: row.minMobileAndroidVersion,
      geofenceRadiusM: row.geofenceRadiusM,
      geofenceSoftRadiusM: row.geofenceSoftRadiusM,
    };
  }
}
