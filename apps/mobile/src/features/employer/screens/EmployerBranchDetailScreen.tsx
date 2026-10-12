import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { getBranch } from '../../../api/branches-api';
import { ApiClientError } from '../../../api/client';
import { JobCard } from '../../../components/job/JobCard';
import { LocationMap } from '../../../components/map/LocationMap';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { StatStrip } from '../../../components/ui/StatStrip';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { openMapsAt } from '../../../shared/maps/open-maps';
import { loadGeofenceRadii } from '../../../shared/location/geofence-config';
import { type GeofenceRadii } from '../../../shared/location/geofence';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<
  EmployerStackParamList,
  'EmployerBranchDetail'
>;

export function EmployerBranchDetailScreen({ route, navigation }: Props) {
  const { branchId } = route.params;
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [city, setCity] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [invite, setInvite] = useState<string | null>(null);
  const [radii, setRadii] = useState<GeofenceRadii | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const branch = await getBranch(branchId, token);
      setName(branch.name);
      setCity(branch.city ?? null);
      setAddress(branch.addressLine1 ?? null);
      setStatus(branch.status);
      setLatitude(branch.latitude);
      setLongitude(branch.longitude);
      setInvite(branch.managerInviteCode ?? null);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    }
  }, [branchId, t]);

  useFocusEffect(
    useCallback(() => {
      void loadGeofenceRadii().then(setRadii);
      void load();
    }, [load]),
  );

  return (
    <ModulePage title={name || t('employer:branches.title')} testID="m.employer.branches.detail" scroll>
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {radii ? (
        <View className="mt-3">
          <StatStrip
            items={[
              {
                label: t('employer:ops.statHard'),
                value: `${radii.radiusM} m`,
              },
              {
                label: t('employer:ops.statSoft'),
                value: `${radii.softRadiusM} m`,
              },
            ]}
          />
        </View>
      ) : null}
      <View className="mt-4">
        <JobCard status={status || undefined} title={name || t('employer:branches.title')}>
          <Text className="font-sans text-sm text-text-medium">
            {[city, address].filter(Boolean).join(' · ')}
          </Text>
          {invite ? (
            <View className="mt-2">
              <StatusBadge
                label={t('employer:branches.invite', { code: invite })}
                tone="warn"
              />
            </View>
          ) : null}
        </JobCard>
      </View>
      {latitude != null && longitude != null ? (
        <View className="mt-4">
          <LocationMap
            pin={{ latitude, longitude }}
            pinLabel={name || undefined}
            radiusM={radii?.radiusM}
            softRadiusM={radii?.softRadiusM}
          />
        </View>
      ) : null}
      <View className="mt-6 gap-3">
        {latitude != null && longitude != null ? (
          <Button
            label={t('employer:branches.openMap')}
            variant="secondary"
            onPress={() => void openMapsAt(latitude, longitude, name || undefined)}
          />
        ) : null}
        <Button
          label={t('employer:branches.edit')}
          onPress={() => navigation.navigate('EmployerBranchForm', { branchId })}
        />
      </View>
    </ModulePage>
  );
}
