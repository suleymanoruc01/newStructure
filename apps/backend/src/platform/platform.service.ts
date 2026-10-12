import { Injectable } from '@nestjs/common';

import { ISTANBUL_TIME_ZONE } from '../common/istanbul-civil.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicRemoteConfig() {
    const [row, adapty] = await Promise.all([
      this.prisma.remoteConfig.findUnique({
        where: { id: 'default' },
      }),
      this.prisma.adaptySettings.findUnique({
        where: { id: 'default' },
      }),
    ]);
    const adaptyOn = Boolean(
      adapty?.enabled && adapty.publicSdkKey.trim().length > 0,
    );
    const payments = {
      adaptyEnabled: adaptyOn,
      adaptyPublicSdkKey: adaptyOn ? adapty!.publicSdkKey : '',
      adaptyPlacementId: adaptyOn ? adapty!.placementId : '',
      appleStoreConnected: adapty?.appleStoreConnected ?? false,
      googleStoreConnected: adapty?.googleStoreConnected ?? false,
    };
    if (!row) {
      return {
        maintenanceMode: false,
        minMobileIosVersion: null,
        minMobileAndroidVersion: null,
        geofenceRadiusM: 100,
        geofenceSoftRadiusM: 150,
        geofenceMaxAccuracyM: 30,
        checkinEarlyMinutes: 15,
        checkinLateMinutes: 30,
        timeZone: ISTANBUL_TIME_ZONE,
        ...payments,
      };
    }
    return {
      maintenanceMode: row.maintenanceMode,
      minMobileIosVersion: row.minMobileIosVersion,
      minMobileAndroidVersion: row.minMobileAndroidVersion,
      geofenceRadiusM: row.geofenceRadiusM,
      geofenceSoftRadiusM: row.geofenceSoftRadiusM,
      geofenceMaxAccuracyM: row.geofenceMaxAccuracyM,
      checkinEarlyMinutes: row.checkinEarlyMinutes,
      checkinLateMinutes: row.checkinLateMinutes,
      timeZone: row.timeZone,
      ...payments,
    };
  }

  async timeZone(): Promise<string> {
    const config = await this.getPublicRemoteConfig();
    return config.timeZone;
  }
}
