import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { checkInToShift, fetchShift } from '../../../api/shifts-api';
import { Screen } from '../../../components/ui/Screen';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { readDeviceCoordinates } from '../../../shared/location/device-coordinates';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerShiftCheckIn'>;

export function WorkerShiftCheckInScreen({ route, navigation }: Props) {
  const { shiftId } = route.params;
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [error, setError] = useState<string | null>(null);
  const [branchLabel, setBranchLabel] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [disputeEligible, setDisputeEligible] = useState(false);

  useEffect(() => {
    void (async () => {
      const token = getAccessToken();
      if (!token) {
        return;
      }
      const shift = await fetchShift(shiftId, token);
      if (shift.branchName) {
        setBranchLabel(shift.branchName);
      }
    })();
  }, [shiftId]);

  const onCheckIn = async () => {
    setSubmitting(true);
    setError(null);
    setDisputeEligible(false);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const device = await readDeviceCoordinates();
      await checkInToShift(
        shiftId,
        token,
        {
          latitude: device.latitude,
          longitude: device.longitude,
          accuracyM: device.accuracyM,
          locationPermissionGranted: device.locationPermissionGranted,
          mockLocation: device.mockLocation,
        },
        `checkin-${shiftId}`,
      );
      navigation.replace('WorkerShiftInShift', { shiftId });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
        if (
          err.code === 'OUTSIDE_GEOFENCE' ||
          err.code === 'MOCK_LOCATION_DETECTED'
        ) {
          setDisputeEligible(true);
        }
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll testID="m.worker.shift.check-in">
      <Text className="text-xl font-bold text-text-high">
        {t('worker:shift.checkInTitle')}
      </Text>
      <Text className="mt-2 text-sm text-text-medium">
        {t('worker:shift.checkInLead')}
      </Text>
      {branchLabel ? (
        <Text className="mt-2 text-sm text-text-low">{branchLabel}</Text>
      ) : null}
      <Text className="mt-2 text-sm text-text-low">
        {t('worker:shift.locationRationale')}
      </Text>
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Pressable
        className="mt-8 rounded-xl bg-brand-primary px-4 py-3"
        disabled={submitting}
        onPress={() => void onCheckIn()}
        testID="CheckInButton"
      >
        <Text className="text-center text-base font-semibold text-white">
          {submitting ? t('common:loading') : t('worker:shift.checkInCta')}
        </Text>
      </Pressable>
      {disputeEligible ? (
        <Pressable
          className="mt-4 rounded-xl border border-brand-primary px-4 py-3"
          onPress={() =>
            navigation.navigate('WorkerShiftDispute', { shiftId })
          }
          testID="OpenDisputeButton"
        >
          <Text className="text-center text-base font-semibold text-brand-primary">
            {t('worker:dispute.openFromCheckIn')}
          </Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}
