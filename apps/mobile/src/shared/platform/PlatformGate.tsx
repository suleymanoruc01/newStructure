import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { fetchPlatformRemoteConfig } from '../../api/platform-api';
import { activateAdapty } from '../../payments/adapty';
import { setDisplayTimeZone } from '../datetime/istanbul';
import { ApiClientError } from '../../api/client';

type PlatformGateProps = {
  children: React.ReactNode;
};

function parseVersion(version: string): number[] {
  return version.split('.').map((part) => Number.parseInt(part, 10) || 0);
}

function isBelowMin(current: string, minimum: string | null): boolean {
  if (!minimum) {
    return false;
  }
  const cur = parseVersion(current);
  const min = parseVersion(minimum);
  for (let i = 0; i < Math.max(cur.length, min.length); i += 1) {
    const c = cur[i] ?? 0;
    const m = min[i] ?? 0;
    if (c < m) {
      return true;
    }
    if (c > m) {
      return false;
    }
  }
  return false;
}

export function PlatformGate({ children }: PlatformGateProps) {
  const { t } = useTranslation(['common']);
  const [blocked, setBlocked] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const config = await fetchPlatformRemoteConfig();
        setDisplayTimeZone(config.timeZone);
        if (config.adaptyEnabled && config.adaptyPublicSdkKey) {
          await activateAdapty(config.adaptyPublicSdkKey);
        }
        if (config.maintenanceMode) {
          setBlocked(t('common:maintenance'));
          return;
        }
        const appVersion = '0.0.1';
        const min =
          Platform.OS === 'ios'
            ? config.minMobileIosVersion
            : config.minMobileAndroidVersion;
        if (isBelowMin(appVersion, min)) {
          setBlocked(t('common:forceUpdate'));
        }
      } catch (err) {
        if (err instanceof ApiClientError && err.status >= 500) {
          setBlocked(t('common:networkError'));
        }
      }
    })();
  }, [t]);

  if (blocked) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="font-sans text-center text-base text-text-high">{blocked}</Text>
      </View>
    );
  }

  return <>{children}</>;
}
