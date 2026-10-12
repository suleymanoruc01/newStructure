import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ShiftIncidentCreateBody } from '@parton/api-contracts';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { createShiftIncident, fetchShift } from '../../../api/shifts-api';
import { JobCard } from '../../../components/job/JobCard';
import { ShiftFacts } from '../../../components/job/ShiftFacts';
import { LocationMap } from '../../../components/map/LocationMap';
import { Button } from '../../../components/ui/Button';
import { ClayChip } from '../../../components/ui/ClayChip';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { StatStrip } from '../../../components/ui/StatStrip';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';
import {
  defaultIncidentSeverity,
  incidentSeverityTone,
} from '../../../shared/shifts/incident-severity';
import { elapsedLabel, remainingLabel } from '../../../shared/datetime/countdown';
import { formatIstanbul, useDisplayTimeZone } from '../../../shared/datetime/istanbul';
import { loadGeofenceRadii } from '../../../shared/location/geofence-config';
import { type GeofenceRadii } from '../../../shared/location/geofence';
import { confirmDestructive } from '../../../shared/ui/confirm-destructive';

const INCIDENT_TYPES: ShiftIncidentCreateBody['type'][] = [
  'job_description_mismatch',
  'workplace_closed',
  'pay_dispute',
  'harassment',
  'emergency_help',
];
const INCIDENT_SEVERITIES: ShiftIncidentCreateBody['severity'][] = [
  'normal',
  'high',
  'critical',
];

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerShiftInShift'>;

export function WorkerShiftInShiftScreen({ route, navigation }: Props) {
  const { shiftId } = route.params ?? { shiftId: '' };
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const timeZone = useDisplayTimeZone();
  const [shift, setShift] = useState<Awaited<
    ReturnType<typeof fetchShift>
  > | null>(null);
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [radii, setRadii] = useState<GeofenceRadii | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [incidentType, setIncidentType] =
    useState<ShiftIncidentCreateBody['type'] | null>(null);
  const [severity, setSeverity] =
    useState<ShiftIncidentCreateBody['severity']>('normal');
  const [incidentNote, setIncidentNote] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
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
        setJobTitle(data.jobTitle ?? null);
        setCheckedInAt(data.checkedInAt ?? null);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(t(`errors:${err.code}`, { defaultValue: err.message }));
        } else {
          setError(t('common:networkError'));
        }
      }
    })();
  }, [shiftId, t]);

  return (
    <ModulePage title={t('worker:shift.inShiftTitle')} testID="m.worker.shift.in-shift" scroll>
      
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('worker:shift.inShiftLead')}
      </Text>
      {checkedInAt && elapsedLabel(checkedInAt, now) ? (
        <View className="mt-3">
          <StatStrip
            items={[
              {
                label: t('worker:shift.statElapsed'),
                value: elapsedLabel(checkedInAt, now)!,
              },
              ...(shift && new Date(shift.endsAt).getTime() > now
                ? [
                    {
                      label: t('worker:shift.statLeft'),
                      value: remainingLabel(shift.endsAt, now) ?? '0 dk',
                    },
                  ]
                : []),
            ]}
          />
        </View>
      ) : null}
      {shift ? (
        <View className="mt-3">
          <JobCard title={jobTitle ?? t('worker:jobs.untitled')} status={shift.status}>
            <ShiftFacts shift={shift} />
          </JobCard>
        </View>
      ) : null}
      {shift?.branchLatitude != null && shift.branchLongitude != null ? (
        <View className="mt-4">
          <LocationMap
            pin={{
              latitude: shift.branchLatitude,
              longitude: shift.branchLongitude,
            }}
            pinLabel={shift.branchName ?? undefined}
            radiusM={radii?.radiusM}
            softRadiusM={radii?.softRadiusM}
          />
        </View>
      ) : null}
      {checkedInAt ? (
        <Text className="font-sans mt-2 text-sm text-text-low">
          {t('worker:shift.checkedInAt', {
            time: formatIstanbul(checkedInAt, timeZone),
          })}
        </Text>
      ) : null}
      {notice ? (
        <Text className="font-sans mt-4 text-sm text-text-medium">{notice}</Text>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Text className="font-sans mt-6 text-sm font-semibold text-text-high">
        {t('worker:shift.incidentTitle')}
      </Text>
      <View className="mt-2 gap-2">
        {INCIDENT_TYPES.map((type) => (
          <JobCard
            key={type}
            title={t(`worker:shift.incident.${type}`)}
            onPress={() => {
              setIncidentType(type);
              setSeverity(defaultIncidentSeverity(type));
              setNotice(null);
            }}
          >
            {incidentType === type ? (
              <StatusBadge
                label={t(`worker:shift.severity.${severity}`)}
                tone={incidentSeverityTone(severity)}
              />
            ) : null}
          </JobCard>
        ))}
      </View>
      {incidentType ? (
        <View className="mt-3 gap-3">
          <View className="flex-row flex-wrap gap-2">
            {INCIDENT_SEVERITIES.map((value) => (
              <ClayChip
                key={value}
                label={t(`worker:shift.severity.${value}`)}
                selected={severity === value}
                onPress={() => setSeverity(value)}
              />
            ))}
          </View>
          <TextField
            label={t('worker:shift.incidentNote')}
            multiline
            numberOfLines={3}
            onChangeText={setIncidentNote}
            value={incidentNote}
          />
          <Button
            disabled={sending}
            label={sending ? t('common:loading') : t('worker:shift.incidentSubmit')}
            onPress={() => {
              void (async () => {
                const confirmed = await confirmDestructive(
                  t(`worker:shift.incident.${incidentType}`),
                  t('worker:shift.incidentConfirm'),
                  t('common:yes'),
                  t('common:cancel'),
                );
                if (!confirmed) {
                  return;
                }
                setSending(true);
                try {
                  const token = getAccessToken();
                  if (!token) {
                    throw new ApiClientError(
                      'Oturum bulunamadı.',
                      401,
                      'UNAUTHORIZED',
                    );
                  }
                  await createShiftIncident(shiftId, token, {
                    type: incidentType,
                    severity,
                    note: incidentNote.trim() || undefined,
                  });
                  setError(null);
                  setNotice(t('worker:shift.incidentSent'));
                  setIncidentNote('');
                } catch (err) {
                  if (err instanceof ApiClientError) {
                    setError(
                      t(`errors:${err.code}`, { defaultValue: err.message }),
                    );
                  } else {
                    setError(t('common:networkError'));
                  }
                } finally {
                  setSending(false);
                }
              })();
            }}
          />
        </View>
      ) : null}
      <View className="mt-8">
        <Button
          label={t('worker:shift.checkOutCta')}
          onPress={() =>
            navigation.navigate('WorkerShiftCheckOut', { shiftId })
          }
          testID="CheckOutNavigateButton"
        />
      </View>
    </ModulePage>
  );
}
