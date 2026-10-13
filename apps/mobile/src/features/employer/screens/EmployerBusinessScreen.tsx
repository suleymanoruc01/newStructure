import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import type { ManagerPermission } from '@parton/api-contracts';
import {
  fetchEmployerMe,
  fetchWorkplaceManagerInvite,
  listWorkplaceManagers,
  patchEmployerMe,
  patchWorkplaceManager,
  patchWorkplaceManagerInvite,
} from '../../../api/employers-api';
import { ManagerPermissionToggles } from '../ManagerPermissionToggles';
import { ApiClientError } from '../../../api/client';
import { formErrorMessage } from '../../../api/form-error';
import { JobCard } from '../../../components/job/JobCard';
import { LocationMap } from '../../../components/map/LocationMap';
import { Button } from '../../../components/ui/Button';
import { CityChips } from '../../../components/ui/CityChips';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken, getActiveContext } from '../../../shared/auth/session-memory';
import { loadGeofenceRadii } from '../../../shared/location/geofence-config';
import { type GeofenceRadii } from '../../../shared/location/geofence';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerBusiness'>;

export function EmployerBusinessScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [legalName, setLegalName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [invite, setInvite] = useState<string | null>(null);
  const [radii, setRadii] = useState<GeofenceRadii | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState<
    { userId: string; status: string; permissions: ManagerPermission[]; phoneE164?: string }[]
  >([]);
  const isEmployer = getActiveContext()?.role === 'employer';

  useEffect(() => {
    void loadGeofenceRadii().then(setRadii);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          return;
        }
        const employer = await fetchEmployerMe(token);
        setLegalName(employer.legalName);
        setTradingName(employer.tradingName ?? '');
        setTaxId(employer.taxId);
        setAddressLine1(employer.addressLine1 ?? '');
        setCity(employer.city ?? '');
        setLatitude(
          employer.latitude != null ? String(employer.latitude) : '',
        );
        setLongitude(
          employer.longitude != null ? String(employer.longitude) : '',
        );
        setInvite(employer.managerInviteCode ?? null);
        if (getActiveContext()?.role === 'employer') {
          const listed = await listWorkplaceManagers(token);
          setManagers(listed.items ?? []);
        }
      } catch (err) {
        setError(formErrorMessage(err, t));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const onSave = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const lat = Number.parseFloat(latitude);
      const lng = Number.parseFloat(longitude);
      const hasPin = Number.isFinite(lat) && Number.isFinite(lng);
      if ((latitude.trim() || longitude.trim()) && !hasPin) {
        throw new ApiClientError(
          t('employer:business.coordsInvalid'),
          400,
          'VALIDATION_FAILED',
        );
      }
      await patchEmployerMe(
        {
          legalName,
          tradingName: tradingName.trim() || undefined,
          addressLine1: addressLine1.trim() || undefined,
          city: city.trim() || undefined,
          latitude: hasPin ? lat : undefined,
          longitude: hasPin ? lng : undefined,
        },
        token,
      );
      navigation.goBack();
    } catch (err) {
      setError(formErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  const onInvite = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await fetchWorkplaceManagerInvite(token);
      setInvite(data.joinCode);
    } catch (err) {
      setError(formErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  const onRotate = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await patchWorkplaceManagerInvite({ rotate: true }, token);
      setInvite(data.joinCode);
    } catch (err) {
      setError(formErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  const lat = Number.parseFloat(latitude);
  const lng = Number.parseFloat(longitude);

  return (
    <ModulePage
      title={t('employer:business.title')}
      testID="m.employer.business.root"
      scroll
    >
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {loading ? (
        <View className="mt-4">
          <SkeletonList rows={2} />
        </View>
      ) : null}
      <View className="mt-6 gap-3">
        {taxId ? (
          <JobCard title={legalName || t('employer:business.title')}>
            <StatusBadge
              label={`${t('employer:business.taxId')} · ${taxId}`}
            />
            {invite ? (
              <View className="mt-2">
                <StatusBadge
                  label={t('employer:business.invite', { code: invite })}
                  tone="warn"
                />
              </View>
            ) : null}
          </JobCard>
        ) : null}
        <TextField
          label={t('employer:business.legalName')}
          value={legalName}
          onChangeText={setLegalName}
        />
        <TextField
          label={t('employer:business.tradingName')}
          value={tradingName}
          onChangeText={setTradingName}
        />
        <TextField
          label={t('employer:business.address')}
          value={addressLine1}
          onChangeText={setAddressLine1}
        />
        <CityChips
          label={t('employer:branches.city')}
          value={city}
          onChange={setCity}
        />
        <LocationMap
          pin={
            Number.isFinite(lat) && Number.isFinite(lng)
              ? { latitude: lat, longitude: lng }
              : null
          }
          pinLabel={legalName || undefined}
          radiusM={radii?.radiusM}
          softRadiusM={radii?.softRadiusM}
          locateMoment="pin-pick"
          onPick={(pin) => {
            setLatitude(String(pin.latitude));
            setLongitude(String(pin.longitude));
          }}
        />
        {isEmployer ? (
          <Button
            disabled={submitting}
            label={t('common:continue')}
            onPress={() => void onSave()}
          />
        ) : null}
        {isEmployer ? (
          <Button
            disabled={submitting}
            label={t('employer:business.inviteCta')}
            onPress={() => void onInvite()}
            variant="secondary"
          />
        ) : null}
        {isEmployer && invite ? (
          <Button
            disabled={submitting}
            label={t('employer:business.inviteRotate')}
            onPress={() => void onRotate()}
            variant="ghost"
          />
        ) : null}
        {isEmployer && managers.length > 0 ? (
          <View className="gap-3">
            <Text className="font-sans text-sm font-semibold text-text-high">
              {t('employer:managers.title')}
            </Text>
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
                        const updated = await patchWorkplaceManager(
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
                        setError(formErrorMessage(err, t));
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
                            const updated = await patchWorkplaceManager(
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
                            setError(formErrorMessage(err, t));
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
        {isEmployer ? (
          <Button
            label={t('employer:business.addWorkplace')}
            onPress={() => navigation.navigate('EmployerCreateWorkplace')}
            variant="ghost"
          />
        ) : null}
      </View>
    </ModulePage>
  );
}
