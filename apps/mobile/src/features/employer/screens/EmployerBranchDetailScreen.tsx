import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import type { ManagerPermission } from '@parton/api-contracts';
import {
  getBranch,
  listBranchManagers,
  patchBranchManager,
  patchBranchManagerInvite,
} from '../../../api/branches-api';
import { ManagerPermissionToggles } from '../ManagerPermissionToggles';
import { hasManagerPermission } from '../../../shared/auth/manager-permissions';
import { ApiClientError } from '../../../api/client';
import { formErrorMessage } from '../../../api/form-error';
import { JobCard } from '../../../components/job/JobCard';
import { LocationMap } from '../../../components/map/LocationMap';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { StatStrip } from '../../../components/ui/StatStrip';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { openMapsAt } from '../../../shared/maps/open-maps';
import { loadGeofenceRadii } from '../../../shared/location/geofence-config';
import { type GeofenceRadii } from '../../../shared/location/geofence';
import { getAccessToken, getActiveContext } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<
  EmployerStackParamList,
  'EmployerBranchDetail'
>;

export function EmployerBranchDetailScreen({ route, navigation }: Props) {
  const { branchId } = route.params ?? { branchId: '' };
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [city, setCity] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [invite, setInvite] = useState<string | null>(null);
  const [publicCode, setPublicCode] = useState<string | null>(null);
  const [radii, setRadii] = useState<GeofenceRadii | null>(null);
  const [managers, setManagers] = useState<
    { userId: string; status: string; permissions: ManagerPermission[]; phoneE164?: string }[]
  >([]);
  const [managerError, setManagerError] = useState<string | null>(null);
  const isEmployer = getActiveContext()?.role === 'employer';

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
      setPublicCode(branch.publicCode ?? null);
      if (getActiveContext()?.role === 'employer') {
        const listed = await listBranchManagers(branchId, token);
        setManagers(listed.items ?? []);
      }
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
            {[publicCode, city, address].filter(Boolean).join(' · ')}
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
        {isEmployer && managers.length > 0 ? (
          <View className="gap-3">
            <Text className="font-sans text-sm font-semibold text-text-high">
              {t('employer:managers.title')}
            </Text>
            {managerError ? (
              <Text className="font-sans text-sm text-feedback-error">
                {managerError}
              </Text>
            ) : null}
            {managers.map((row) => (
              <JobCard
                key={row.userId}
                title={row.phoneE164 ?? row.userId}
                status={row.status}
              >
                <ManagerPermissionToggles
                  value={row.permissions}
                  onChange={(permissions) => {
                    void (async () => {
                      try {
                        const token = getAccessToken();
                        if (!token) {
                          return;
                        }
                        const updated = await patchBranchManager(
                          branchId,
                          row.userId,
                          { permissions },
                          token,
                        );
                        setManagers((current) =>
                          current.map((item) =>
                            item.userId === row.userId
                              ? { ...item, permissions: updated.permissions }
                              : item,
                          ),
                        );
                      } catch (err) {
                        setManagerError(formErrorMessage(err, t));
                      }
                    })();
                  }}
                />
                {row.status !== 'revoked' ? (
                  <View className="mt-2">
                    <Button
                      label={t('employer:managers.revoke')}
                      variant="ghost"
                      onPress={() => {
                        void (async () => {
                          try {
                            const token = getAccessToken();
                            if (!token) {
                              return;
                            }
                            const updated = await patchBranchManager(
                              branchId,
                              row.userId,
                              { status: 'revoked' },
                              token,
                            );
                            setManagers((current) =>
                              current.map((item) =>
                                item.userId === row.userId
                                  ? { ...item, status: updated.status }
                                  : item,
                              ),
                            );
                          } catch (err) {
                            setManagerError(formErrorMessage(err, t));
                          }
                        })();
                      }}
                    />
                  </View>
                ) : null}
              </JobCard>
            ))}
          </View>
        ) : null}
        {isEmployer && invite ? (
          <Button
            label={t('employer:branches.inviteRotate')}
            variant="secondary"
            onPress={() => {
              void (async () => {
                try {
                  const token = getAccessToken();
                  if (!token) {
                    return;
                  }
                  const rotated = await patchBranchManagerInvite(
                    branchId,
                    { rotate: true },
                    token,
                  );
                  setInvite(rotated.joinCode);
                } catch (err) {
                  setError(formErrorMessage(err, t));
                }
              })();
            }}
          />
        ) : null}
        {hasManagerPermission('branches.update') ? (
          <Button
            label={t('employer:branches.edit')}
            onPress={() => navigation.navigate('EmployerBranchForm', { branchId })}
          />
        ) : null}
      </View>
    </ModulePage>
  );
}
