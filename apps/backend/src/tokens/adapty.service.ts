import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from '../common/api.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';

export const ADAPTY_PROFILE_URL =
  'https://api.adapty.io/api/v2/server-side-api/profile/';

export function adaptyActive(settings: {
  enabled: boolean;
  publicSdkKey: string;
  secretKey: string;
}): boolean {
  return (
    settings.enabled &&
    settings.publicSdkKey.trim().length > 0 &&
    settings.secretKey.length > 0
  );
}

export function profileHasTransaction(
  profile: unknown,
  transactionId: string,
  vendorProductIds: string[],
): boolean {
  if (!transactionId) {
    return false;
  }
  const haystack = JSON.stringify(profile);
  if (!haystack.includes(transactionId)) {
    return false;
  }
  const vendors = vendorProductIds.map((id) => id.trim()).filter(Boolean);
  if (vendors.length === 0) {
    return true;
  }
  return vendors.some((id) => haystack.includes(id));
}

@Injectable()
export class AdaptyService {
  private readonly logger = new Logger(AdaptyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async loadSettings() {
    const row = await this.prisma.adaptySettings.findUnique({
      where: { id: 'default' },
    });
    return (
      row ?? {
        id: 'default',
        enabled: false,
        publicSdkKey: '',
        secretKey: '',
        webhookAuthorization: '',
        placementId: '',
        appleStoreConnected: false,
        googleStoreConnected: false,
        updatedAt: new Date(0),
      }
    );
  }

  async isActive(): Promise<boolean> {
    return adaptyActive(await this.loadSettings());
  }

  async health(): Promise<{
    name: 'adapty';
    status: 'up' | 'degraded' | 'down';
    detail: string;
  }> {
    const settings = await this.loadSettings();
    if (!settings.enabled) {
      return {
        name: 'adapty',
        status: 'degraded',
        detail: 'Kapalı — mağaza satışı yok; admin/test kredisi çalışır',
      };
    }
    if (!adaptyActive(settings)) {
      return {
        name: 'adapty',
        status: 'down',
        detail: 'Açık ama public SDK veya secret eksik',
      };
    }
    return {
      name: 'adapty',
      status: 'up',
      detail: 'Adapty anahtarları kayıtlı',
    };
  }

  async probe(): Promise<{
    name: 'adapty';
    status: 'up' | 'degraded' | 'down';
    detail: string;
  }> {
    const local = await this.health();
    if (local.status !== 'up') {
      return local;
    }
    const settings = await this.loadSettings();
    try {
      const url = new URL(ADAPTY_PROFILE_URL);
      url.searchParams.set('customer_user_id', 'parton-admin-probe');
      const response = await fetch(url, {
        headers: {
          Authorization: `Api-Key ${settings.secretKey}`,
          Accept: 'application/json',
        },
      });
      if (response.status === 401 || response.status === 403) {
        return {
          name: 'adapty',
          status: 'down',
          detail: `Secret reddedildi (HTTP ${response.status})`,
        };
      }
      return {
        name: 'adapty',
        status: 'up',
        detail: `Adapty API yanıtı HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        name: 'adapty',
        status: 'down',
        detail:
          error instanceof Error ? error.message : 'Adapty erişilemedi',
      };
    }
  }

  publicSnapshot(settings: {
    enabled: boolean;
    publicSdkKey: string;
    placementId: string;
    appleStoreConnected: boolean;
    googleStoreConnected: boolean;
  }) {
    const on = settings.enabled && settings.publicSdkKey.trim().length > 0;
    return {
      adaptyEnabled: on,
      adaptyPublicSdkKey: on ? settings.publicSdkKey : '',
      adaptyPlacementId: on ? settings.placementId : '',
      appleStoreConnected: settings.appleStoreConnected,
      googleStoreConnected: settings.googleStoreConnected,
    };
  }

  webhookAuthorized(header: string | undefined, expected: string): boolean {
    if (!expected) {
      return false;
    }
    return header === expected;
  }

  async assertStorePurchase(input: {
    customerUserId: string;
    transactionId: string;
    vendorProductIds: string[];
  }): Promise<void> {
    const settings = await this.loadSettings();
    if (!adaptyActive(settings)) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Adapty kapalı.',
      );
    }
    const url = new URL(ADAPTY_PROFILE_URL);
    url.searchParams.set('customer_user_id', input.customerUserId);
    const response = await fetch(url, {
      headers: {
        Authorization: `Api-Key ${settings.secretKey}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      this.logger.error(`Adapty profile HTTP ${response.status}`);
      throw new ApiException(
        HttpStatus.BAD_GATEWAY,
        ErrorCode.INTERNAL_ERROR,
        'Ödeme doğrulanamadı.',
      );
    }
    const profile: unknown = await response.json();
    if (
      !profileHasTransaction(
        profile,
        input.transactionId,
        input.vendorProductIds,
      )
    ) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.PAYMENT_DECLINED,
        'Mağaza ödemesi doğrulanamadı.',
      );
    }
  }
}
