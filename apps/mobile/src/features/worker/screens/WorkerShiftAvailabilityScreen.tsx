import { statusLabelTr } from '@parton/api-contracts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { fetchJobDetail } from '../../../api/jobs-api';
import { confirmAvailability, fetchShift } from '../../../api/shifts-api';
import { JobCard } from '../../../components/job/JobCard';
import { JobFacts } from '../../../components/job/JobFacts';
import { LocationMap } from '../../../components/map/LocationMap';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { StatusBadge, statusTone } from '../../../components/ui/StatusBadge';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { remainingLabel } from '../../../shared/datetime/countdown';
import { formatPayTry } from '../../../shared/format/pay';
import { type GeofenceRadii } from '../../../shared/location/geofence';
import { loadGeofenceRadii } from '../../../shared/location/geofence-config';

type Props = NativeStackScreenProps<
  WorkerStackParamList,
  'WorkerShiftAvailability'
>;

export function WorkerShiftAvailabilityScreen({ route, navigation }: Props) {
  const { shiftId } = route.params ?? { shiftId: '' };
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shift, setShift] = useState<Awaited<
    ReturnType<typeof fetchShift>
  > | null>(null);
  const [job, setJob] = useState<Awaited<
    ReturnType<typeof fetchJobDetail>
  > | null>(null);
  const [radii, setRadii] = useState<GeofenceRadii | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

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
        const data = await fetchShift(shiftId, token);
        setShift(data);
        setJob(await fetchJobDetail(data.jobId, token));
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(t(`errors:${err.code}`, { defaultValue: err.message }));
        } else {
          setError(t('common:networkError'));
        }
      }
    })();
  }, [shiftId, t]);

  const onDecision = async (decision: 'can_come' | 'cannot_come') => {
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await confirmAvailability(shiftId, token, { decision });
      if (decision === 'can_come') {
        navigation.replace('WorkerShiftPrep', { shiftId });
      } else {
        navigation.popToTop();
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deadline = shift?.confirmWindow?.deadlineAt;
  const left = deadline ? remainingLabel(deadline, now) : null;
  const lat = shift?.branchLatitude ?? job?.branchLatitude;
  const lng = shift?.branchLongitude ?? job?.branchLongitude;
  const pay = job ? formatPayTry(job.payAmountMinor, job.payCurrency) : null;

  return (
    <ModulePage title={t('worker:shift.availabilityTitle')} testID="m.worker.shift.availability-confirm" scroll>
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('worker:shift.availabilityLead')}
      </Text>
      {!shift && !error ? (
        <View className="mt-4">
          <SkeletonList rows={2} />
        </View>
      ) : null}
      {shift ? (
        <View className="mt-2">
          <StatusBadge
            label={statusLabelTr(shift.status)}
            tone={statusTone(shift.status)}
          />
        </View>
      ) : null}
      {left ? (
        <View className="mt-2">
          <StatusBadge
            label={t('worker:prep.windowOpen', { time: left })}
            tone="warn"
          />
        </View>
      ) : null}
      {left || pay ? (
        <View className="mt-3">
          <StatStrip
            items={[
              ...(left
                ? [{ label: t('worker:shift.statWindow'), value: left }]
                : []),
              ...(pay ? [{ label: t('worker:jobs.pay'), value: pay }] : []),
            ]}
          />
        </View>
      ) : null}
      {job && shift ? (
        <View className="mt-3">
          <JobCard
            status={shift.status}
            title={shift.jobTitle ?? shift.branchName ?? t('worker:jobs.untitled')}
          >
            <JobFacts
              branchName={shift.branchName}
              startsAt={shift.startsAt}
              endsAt={shift.endsAt}
              payAmountMinor={job.payAmountMinor}
              payCurrency={job.payCurrency}
              amenities={job.amenities}
              requiredDocumentTypes={job.requiredDocumentTypes}
            />
          </JobCard>
        </View>
      ) : null}
      {lat != null && lng != null ? (
        <View className="mt-4">
          <LocationMap
            pin={{ latitude: lat, longitude: lng }}
            pinLabel={shift?.branchName ?? undefined}
            radiusM={radii?.radiusM}
            softRadiusM={radii?.softRadiusM}
          />
        </View>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-8 gap-3">
        <Button
          disabled={submitting}
          label={t('worker:shift.canCome')}
          onPress={() => void onDecision('can_come')}
        />
        <Button
          disabled={submitting}
          label={t('worker:shift.cannotCome')}
          onPress={() => void onDecision('cannot_come')}
          variant="destructive"
        />
      </View>
    </ModulePage>
  );
}
