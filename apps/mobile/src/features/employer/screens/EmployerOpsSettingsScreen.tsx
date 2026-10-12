import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { fetchPlatformRemoteConfig } from '../../../api/platform-api';
import { JobCard } from '../../../components/job/JobCard';
import { NavRow } from '../../../components/ui/NavRow';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { StatStrip } from '../../../components/ui/StatStrip';
import { ModulePage } from '../../../components/ui/ScreenModules';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerOpsSettings'>;

export function EmployerOpsSettingsScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'system', 'common']);
  const [config, setConfig] = useState<Awaited<
    ReturnType<typeof fetchPlatformRemoteConfig>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchPlatformRemoteConfig()
      .then(setConfig)
      .catch(() => setError(t('common:networkError')));
  }, [t]);

  return (
    <ModulePage
      title={t('employer:ops.title')}
      testID="m.employer.ops.settings"
      scroll
    >
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {!config && !error ? (
        <View className="mt-4">
          <SkeletonList />
        </View>
      ) : null}
      {config ? (
        <View className="mt-2 gap-3">
          <StatStrip
            items={[
              {
                label: t('employer:ops.statHard'),
                value: `${config.geofenceRadiusM} m`,
              },
              {
                label: t('employer:ops.statSoft'),
                value: `${config.geofenceSoftRadiusM} m`,
              },
              {
                label: t('employer:ops.statAccuracy'),
                value: `${config.geofenceMaxAccuracyM} m`,
              },
              {
                label: t('employer:ops.statEarly'),
                value: `${config.checkinEarlyMinutes} dk`,
              },
              {
                label: t('employer:ops.statLate'),
                value: `${config.checkinLateMinutes} dk`,
              },
            ]}
          />
          <JobCard title={t('employer:ops.title')}>
            <StatusBadge
              label={t('employer:ops.statAccuracy')}
              tone="strong"
            />
            <Text className="font-sans mt-2 text-sm text-text-medium">
              {t('employer:ops.geofence', {
                hard: config.geofenceRadiusM,
                soft: config.geofenceSoftRadiusM,
                accuracy: config.geofenceMaxAccuracyM,
              })}
            </Text>
            <Text className="font-sans mt-2 text-sm text-text-medium">
              {t('employer:ops.lateWindow', {
                early: config.checkinEarlyMinutes,
                late: config.checkinLateMinutes,
              })}
            </Text>
            <Text className="font-sans mt-2 text-sm text-text-medium">
              {t('employer:ops.tokenHold')}
            </Text>
          </JobCard>
        </View>
      ) : null}
      <View className="mt-4">
        <NavRow
          label={t('employer:business.title')}
          onPress={() => navigation.navigate('EmployerBusiness')}
        />
        <NavRow
          label={t('employer:industry.title')}
          onPress={() => navigation.navigate('EmployerIndustry')}
        />
        <NavRow
          label={t('employer:jobs.navVerification')}
          onPress={() => navigation.navigate('EmployerVerificationStatus')}
        />
        <NavRow
          label={t('system:settings.title')}
          onPress={() => navigation.navigate('SharedSettings')}
        />
      </View>
    </ModulePage>
  );
}
