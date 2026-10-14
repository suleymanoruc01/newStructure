import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { checkInToShift, fetchShift } from '../../../api/shifts-api';
import { JobCard } from '../../../components/job/JobCard';
import { ShiftFacts } from '../../../components/job/ShiftFacts';
import { LocationMap } from '../../../components/map/LocationMap';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { StatStrip } from '../../../components/ui/StatStrip';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { remainingLabel } from '../../../shared/datetime/countdown';
import {
  readDeviceCoordinates,
  watchDeviceCoordinates,
  type DeviceCoordinates,
} from '../../../shared/location/device-coordinates';
import { CoordinateFilter } from '../../../shared/location/coordinate-filter';
import { loadGeofenceRadii } from '../../../shared/location/geofence-config';
import { triggerHaptic } from '../../../shared/ui/haptics';
import {
  evaluateGeofencePreview,
  haversineM,
  type GeofenceRadii,
} from '../../../shared/location/geofence';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerShiftCheckIn'>;

export function WorkerShiftCheckInScreen({ route, navigation }: Props) {
  const { shiftId } = route.params ?? { shiftId: '' };
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [error, setError] = useState<string | null>(null);
  const [branchLabel, setBranchLabel] = useState<string | null>(null);
  const [branchLat, setBranchLat] = useState<number | null>(null);
  const [branchLng, setBranchLng] = useState<number | null>(null);
  const [device, setDevice] = useState<DeviceCoordinates | null>(null);
  const [previous, setPrevious] = useState<DeviceCoordinates | null>(null);
  const lastSample = useRef<DeviceCoordinates | null>(null);
  const filterRef = useRef(new CoordinateFilter());
  const [radii, setRadii] = useState<GeofenceRadii | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [disputeEligible, setDisputeEligible] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [shift, setShift] = useState<Awaited<
    ReturnType<typeof fetchShift>
  > | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    void loadGeofenceRadii().then(setRadii);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    void (async () => {
      const token = getAccessToken();
      if (!token) {
        return;
      }
      const data = await fetchShift(shiftId, token);
      setShift(data);
      if (data.branchName) {
        setBranchLabel(data.branchName);
      }
      setBranchLat(data.branchLatitude ?? null);
      setBranchLng(data.branchLongitude ?? null);
    })();
  }, [shiftId]);

  useEffect(() => {
    return watchDeviceCoordinates(
      'check-in',
      (sample) => {
        setPermissionDenied(false);
        const smoothed = filterRef.current.update(
          sample.latitude,
          sample.longitude,
          sample.accuracyM,
        );
        const processedSample: DeviceCoordinates = {
          ...sample,
          latitude: smoothed.latitude,
          longitude: smoothed.longitude,
          accuracyM: smoothed.accuracyM,
        };
        setPrevious(lastSample.current);
        lastSample.current = processedSample;
        setDevice(processedSample);
      },
      (err) => {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
        if (err.code === 'LOCATION_PERMISSION_DENIED') {
          setPermissionDenied(true);
        }
      },
    );
  }, [t]);

  const preview =
    device && branchLat != null && branchLng != null && radii
      ? evaluateGeofencePreview(
          {
            branchLatitude: branchLat,
            branchLongitude: branchLng,
            latitude: device.latitude,
            longitude: device.longitude,
            accuracyM: device.accuracyM,
            locationSource: device.locationSource,
          },
          radii,
        )
      : null;
  const moving =
    device && previous
      ? haversineM(
          previous.latitude,
          previous.longitude,
          device.latitude,
          device.longitude,
        ) > 15
      : false;
  const canCheckIn =
    Boolean(preview) &&
    (preview?.inside || preview?.softPass) &&
    !device?.mockLocation &&
    !moving;

  const onCheckIn = async () => {
    setSubmitting(true);
    setError(null);
    setDisputeEligible(false);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const sample = await readDeviceCoordinates('check-in');
      await checkInToShift(
        shiftId,
        token,
        {
          latitude: sample.latitude,
          longitude: sample.longitude,
          accuracyM: sample.accuracyM,
          locationPermissionGranted: sample.locationPermissionGranted,
          mockLocation: sample.mockLocation,
          locationSource: sample.locationSource,
        },
        `checkin-${shiftId}`,
      );
      triggerHaptic('success');
      navigation.replace('WorkerShiftInShift', { shiftId });
    } catch (err) {
      triggerHaptic('error');
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
        if (
          err.code === 'OUTSIDE_GEOFENCE' ||
          err.code === 'MOCK_LOCATION_DETECTED'
        ) {
          setDisputeEligible(true);
        }
        if (err.code === 'LOCATION_PERMISSION_DENIED') {
          setPermissionDenied(true);
        }
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startsLeft = shift?.startsAt
    ? remainingLabel(shift.startsAt, now)
    : null;
  const geofenceTone = device?.mockLocation || moving
    ? 'error'
    : !preview
      ? 'warn'
      : preview.inside
        ? 'strong'
        : preview.softPass
          ? 'warn'
          : 'error';
  const geofenceLabel = !device
    ? t('worker:shift.waitingGps')
    : device.mockLocation
      ? t('errors:MOCK_LOCATION_DETECTED', {
          defaultValue: t('worker:shift.geofenceOutside'),
        })
      : moving
        ? t('worker:shift.moving')
        : preview?.inside
          ? t('worker:shift.geofenceInside')
          : preview?.softPass
            ? t('worker:shift.geofenceSoft')
            : t('worker:shift.geofenceOutside');

  return (
    <ModulePage title={t('worker:shift.checkInTitle')} testID="m.worker.shift.check-in" scroll>
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('worker:shift.checkInLead')}
      </Text>
      <View className="mt-3">
        <JobCard title={branchLabel ?? t('worker:shift.checkInTitle')}>
          <StatusBadge label={geofenceLabel} tone={geofenceTone} />
          {shift ? (
            <View className="mt-2">
              <ShiftFacts shift={shift} />
            </View>
          ) : null}
          {startsLeft ? (
            <View className="mt-2">
              <StatusBadge
                label={
                  startsLeft === '0 dk'
                    ? t('worker:shift.startDue')
                    : t('worker:shift.startsIn', { time: startsLeft })
                }
                tone={startsLeft === '0 dk' ? 'strong' : 'warn'}
              />
            </View>
          ) : null}
        </JobCard>
      </View>
      <Text className="font-sans mt-2 text-sm text-text-low">
        {t('worker:shift.locationRationale')}
      </Text>
      {preview && device && radii ? (
        <View className="mt-3">
          <StatStrip
            items={[
              {
                label: t('worker:shift.statDistance'),
                value: t('worker:shift.distanceM', {
                  meters: Math.round(preview.distanceM),
                }),
              },
              {
                label: t('worker:shift.statAccuracy'),
                value: `${Math.round(device.accuracyM)} m`,
              },
              {
                label: t('worker:shift.statRadius'),
                value: `${radii.radiusM} m`,
              },
            ]}
          />
        </View>
      ) : null}
      {branchLat != null && branchLng != null ? (
        <View className="mt-4">
          <LocationMap
            pin={{ latitude: branchLat, longitude: branchLng }}
            pinLabel={branchLabel ?? undefined}
            user={
              device
                ? { latitude: device.latitude, longitude: device.longitude }
                : null
            }
            radiusM={radii?.radiusM}
            softRadiusM={radii?.softRadiusM}
          />
        </View>
      ) : (
        <Text className="font-sans mt-4 text-sm text-feedback-error">
          {t('worker:shift.locationMissing')}
        </Text>
      )}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {permissionDenied ? (
        <Button
          className="mt-4"
          label={t('common:map.openSettings')}
          variant="secondary"
          onPress={() => void Linking.openSettings()}
        />
      ) : null}
      <Button
        className="mt-8"
        disabled={submitting || !canCheckIn}
        label={submitting ? t('common:loading') : t('worker:shift.checkInCta')}
        onPress={() => void onCheckIn()}
        testID="CheckInButton"
      />
      {disputeEligible || (preview && !preview.inside && !preview.softPass) ? (
        <Button
          className="mt-4"
          label={t('worker:dispute.openFromCheckIn')}
          onPress={() =>
            navigation.navigate('WorkerShiftDispute', { shiftId })
          }
          testID="OpenDisputeButton"
          variant="secondary"
        />
      ) : null}
    </ModulePage>
  );
}
