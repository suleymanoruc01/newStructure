import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { statusLabelTr } from '@parton/api-contracts';
import { fetchJobDetail } from '../../../api/jobs-api';
import { fetchShift } from '../../../api/shifts-api';
import { ApiClientError } from '../../../api/client';
import { JobCard } from '../../../components/job/JobCard';
import { JobFacts } from '../../../components/job/JobFacts';
import { LocationMap } from '../../../components/map/LocationMap';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatusBadge, statusTone } from '../../../components/ui/StatusBadge';
import { StatStrip } from '../../../components/ui/StatStrip';
import { addEventToCalendar } from '../../../shared/calendar/add-to-calendar';
import { openMapsAt } from '../../../shared/maps/open-maps';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { remainingLabel } from '../../../shared/datetime/countdown';
import { formatPayTry } from '../../../shared/format/pay';
import { loadGeofenceRadii } from '../../../shared/location/geofence-config';
import { type GeofenceRadii } from '../../../shared/location/geofence';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerShiftPrep'>;

export function WorkerShiftPrepScreen({ route, navigation }: Props) {
  const { shiftId } = route.params ?? { shiftId: '' };
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [deadlineAt, setDeadlineAt] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [job, setJob] = useState<Awaited<ReturnType<typeof fetchJobDetail>> | null>(
    null,
  );
  const [radii, setRadii] = useState<GeofenceRadii | null>(null);
  const [now, setNow] = useState(Date.now());
  const [shiftStatus, setShiftStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
          throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
        }
        setLoading(true);
        const shift = await fetchShift(shiftId, token);
        setTitle(shift.jobTitle ?? null);
        setBranchName(shift.branchName ?? null);
        setStartsAt(shift.startsAt);
        setEndsAt(shift.endsAt);
        setDeadlineAt(shift.confirmWindow?.deadlineAt ?? null);
        setLatitude(shift.branchLatitude ?? null);
        setLongitude(shift.branchLongitude ?? null);
        setShiftStatus(shift.status);
        const detail = await fetchJobDetail(shift.jobId, token);
        setJob(detail);
        if (detail.branchLatitude != null) {
          setLatitude(detail.branchLatitude);
        }
        if (detail.branchLongitude != null) {
          setLongitude(detail.branchLongitude);
        }
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(t(`errors:${err.code}`, { defaultValue: err.message }));
        } else {
          setError(t('common:networkError'));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [shiftId, t]);

  const left = deadlineAt ? remainingLabel(deadlineAt, now) : null;
  const pay = job ? formatPayTry(job.payAmountMinor, job.payCurrency) : null;

  return (
    <ModulePage title={t('worker:prep.title')} testID="m.worker.shift.prep" scroll>
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {loading && !job ? (
        <View className="mt-4">
          <SkeletonList rows={2} />
        </View>
      ) : null}
      {shiftStatus ? (
        <View className="mt-2">
          <StatusBadge
            label={statusLabelTr(shiftStatus)}
            tone={statusTone(shiftStatus)}
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
      {job && startsAt && endsAt ? (
        <View className="mt-3">
          <JobCard title={title ?? t('worker:jobs.untitled')}>
            <JobFacts
              branchName={branchName}
              startsAt={startsAt}
              endsAt={endsAt}
              payAmountMinor={job.payAmountMinor}
              payCurrency={job.payCurrency}
              amenities={job.amenities}
              requiredDocumentTypes={job.requiredDocumentTypes}
              notes={job.notes}
            />
          </JobCard>
        </View>
      ) : null}
      <Text className="font-sans mt-4 text-sm text-text-medium">
        {radii
          ? t('worker:prep.radius', { meters: radii.radiusM })
          : t('common:loading')}
      </Text>
      {latitude != null && longitude != null ? (
        <View className="mt-4">
          <LocationMap
            pin={{ latitude, longitude }}
            pinLabel={branchName ?? undefined}
            radiusM={radii?.radiusM}
            softRadiusM={radii?.softRadiusM}
          />
        </View>
      ) : null}
      <View className="mt-3">
        <JobCard title={t('worker:prep.title')}>
          <Text className="font-sans text-sm text-text-medium">
            {t('worker:prep.checklistArrive')}
          </Text>
          <Text className="font-sans mt-1 text-sm text-text-medium">
            {t('worker:prep.checklistGps')}
          </Text>
          <Text className="font-sans mt-1 text-sm text-text-medium">
            {t('worker:prep.checklistDocs')}
          </Text>
        </JobCard>
      </View>
      <View className="mt-6 gap-3">
        {latitude != null && longitude != null ? (
          <Button
            label={t('worker:prep.openMap')}
            variant="secondary"
            onPress={() =>
              void openMapsAt(latitude, longitude, branchName ?? undefined)
            }
          />
        ) : null}
        {startsAt && endsAt ? (
          <Button
            label={t('worker:prep.addCalendar')}
            variant="secondary"
            onPress={() =>
              void addEventToCalendar({
                title: title ?? t('worker:jobs.untitled'),
                startsAt,
                endsAt,
                location: branchName ?? undefined,
              })
            }
          />
        ) : null}
        <Button
          label={t('worker:shift.checkInCta')}
          onPress={() => navigation.navigate('WorkerShiftCheckIn', { shiftId })}
        />
      </View>
    </ModulePage>
  );
}
