import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { statusLabelTr } from '@parton/api-contracts';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import { formErrorMessage } from '../../../api/form-error';
import { listJobApplications } from '../../../api/applications-api';
import { fetchJobDetail, patchEmployerJob } from '../../../api/jobs-api';
import { JobCard } from '../../../components/job/JobCard';
import { JobFacts } from '../../../components/job/JobFacts';
import { LocationMap } from '../../../components/map/LocationMap';
import { Button } from '../../../components/ui/Button';
import { ClayChip } from '../../../components/ui/ClayChip';
import { clayChip } from '../../../components/ui/clay';
import { Pressable } from '../../../components/ui/Pressable';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { formatPayTry } from '../../../shared/format/pay';
import { loadGeofenceRadii } from '../../../shared/location/geofence-config';
import { type GeofenceRadii } from '../../../shared/location/geofence';
import { confirmDestructive } from '../../../shared/ui/confirm-destructive';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerJobDetail'>;

export function EmployerJobDetailScreen({ navigation, route }: Props) {
  const { jobId } = route.params;
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('');
  const [headcount, setHeadcount] = useState('');
  const [job, setJob] = useState<Awaited<ReturnType<typeof fetchJobDetail>> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [radii, setRadii] = useState<GeofenceRadii | null>(null);
  const [applicantCounts, setApplicantCounts] = useState({
    pending: 0,
    accepted: 0,
    substitute: 0,
  });
  const [pendingPreview, setPendingPreview] = useState<
    Awaited<ReturnType<typeof listJobApplications>>['items']
  >([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await fetchJobDetail(jobId, token);
      setJob(data);
      setTitle(data.title ?? data.id);
      setStatus(data.status);
      setHeadcount(String(data.headcount));
      let apps: Awaited<ReturnType<typeof listJobApplications>>;
      try {
        apps = await listJobApplications(jobId, token);
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 403) {
          apps = { items: [] };
        } else {
          throw err;
        }
      }
      setApplicantCounts({
        pending: apps.items.filter((row) => row.status === 'pending').length,
        accepted: apps.items.filter((row) => row.status === 'accepted').length,
        substitute: apps.items.filter((row) => row.status === 'substitute')
          .length,
      });
      setPendingPreview(
        apps.items.filter((row) => row.status === 'pending'),
      );
    } catch (err) {
      setError(formErrorMessage(err, t));
    }
  }, [jobId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadGeofenceRadii().then(setRadii);
  }, []);

  const saveHeadcount = async () => {
    const parsed = Number.parseInt(headcount, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setError(t('employer:jobs.detail.invalidHeadcount'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const idem = `job-hc-${jobId}-${Date.now()}`;
      await patchEmployerJob(jobId, { headcount: parsed }, token, idem);
      await load();
    } catch (err) {
      setError(formErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  const closeJob = async () => {
    const confirmed = await confirmDestructive(
      t('employer:jobs.detail.closeJob'),
      t('employer:jobs.detail.closeJobBody'),
      t('employer:jobs.detail.closeJob'),
      t('common:cancel'),
    );
    if (!confirmed) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await patchEmployerJob(
        jobId,
        { status: 'closed' },
        token,
        `job-close-${jobId}-${Date.now()}`,
      );
      await load();
    } catch (err) {
      setError(formErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  const published = status === 'published';

  return (
    <ModulePage title={title} testID="m.employer.jobs.detail" scroll>
      {!job && !error ? (
        <View className="mt-4">
          <SkeletonList rows={2} />
        </View>
      ) : null}
      {job ? (
        <View className="mt-3">
          <StatStrip
            items={[
              {
                label: t('employer:home.statSeats'),
                value: String(job.remainingHeadcount),
              },
              {
                label: t('employer:jobs.headcount'),
                value: String(job.headcount),
              },
              ...(formatPayTry(job.payAmountMinor, job.payCurrency)
                ? [
                    {
                      label: t('employer:jobs.pay'),
                      value: formatPayTry(job.payAmountMinor, job.payCurrency)!,
                    },
                  ]
                : []),
              {
                label: statusLabelTr('pending'),
                value: String(applicantCounts.pending),
              },
              {
                label: statusLabelTr('accepted'),
                value: String(applicantCounts.accepted),
              },
              {
                label: statusLabelTr('substitute'),
                value: String(applicantCounts.substitute),
              },
            ]}
          />
        </View>
      ) : null}
      {job ? (
        <View className="mt-3">
          <JobCard status={status || undefined} title={job.title ?? job.branchName ?? job.id}>
            <JobFacts
              branchName={job.branchName}
              startsAt={job.startsAt}
              endsAt={job.endsAt}
              payAmountMinor={job.payAmountMinor}
              payCurrency={job.payCurrency}
              headcount={job.headcount}
              remainingHeadcount={job.remainingHeadcount}
              favoritesOnly={job.favoritesOnly}
              instantAutoApprove={job.instantAutoApprove}
              requiredDocumentTypes={job.requiredDocumentTypes}
              amenities={job.amenities}
              notes={job.notes}
            />
          </JobCard>
        </View>
      ) : null}
      {job?.branchLatitude != null && job.branchLongitude != null ? (
        <View className="mt-4">
          <LocationMap
            pin={{
              latitude: job.branchLatitude,
              longitude: job.branchLongitude,
            }}
            pinLabel={job.branchName}
            radiusM={radii?.radiusM}
            softRadiusM={radii?.softRadiusM}
          />
        </View>
      ) : null}
      {published ? (
        <View className="mt-6 gap-3">
          <View className="flex-row flex-wrap gap-2">
            {(
              [
                ['pending', applicantCounts.pending],
                ['accepted', applicantCounts.accepted],
                ['substitute', applicantCounts.substitute],
              ] as const
            ).map(([value, count]) => (
              <ClayChip
                key={value}
                label={`${statusLabelTr(value)} · ${count}`}
                onPress={() =>
                  navigation.navigate('EmployerApplicants', {
                    jobId,
                    jobTitle: title,
                    filter: value,
                  })
                }
              />
            ))}
          </View>
          {pendingPreview.map((item) => {
            const name =
              item.workerDisplayName ??
              `${item.profileSnapshot.firstName ?? ''} ${item.profileSnapshot.lastName ?? ''}`.trim();
            return (
              <JobCard
                key={item.id}
                status={item.status}
                title={name || t('employer:applicants.detailTitle')}
                onPress={() =>
                  navigation.navigate('EmployerApplicantDetail', {
                    applicationId: item.id,
                    jobTitle: title,
                  })
                }
              />
            );
          })}
          <Button
            label={t('employer:jobs.applicants')}
            onPress={() =>
              navigation.navigate('EmployerApplicants', {
                jobId,
                jobTitle: title,
              })
            }
          />
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('employer:jobs.headcount')}
          </Text>
          <View className="flex-row items-center gap-3">
            <Pressable
              className="h-11 w-11 items-center justify-center rounded-full bg-surface-1"
              style={clayChip(false)}
              onPress={() =>
                setHeadcount(
                  String(Math.max(1, (Number.parseInt(headcount, 10) || 1) - 1)),
                )
              }
            >
              <Text className="font-sans text-lg text-text-high">−</Text>
            </Pressable>
            <Text className="font-display text-xl font-semibold text-text-high">
              {Number.parseInt(headcount, 10) || 1}
            </Text>
            <Pressable
              className="h-11 w-11 items-center justify-center rounded-full bg-surface-1"
              style={clayChip(false)}
              onPress={() =>
                setHeadcount(
                  String((Number.parseInt(headcount, 10) || 1) + 1),
                )
              }
            >
              <Text className="font-sans text-lg text-text-high">+</Text>
            </Pressable>
          </View>
          {error ? (
            <Text className="font-sans text-sm text-feedback-error">{error}</Text>
          ) : null}
          <Button
            label={
              submitting
                ? t('common:loading')
                : t('employer:jobs.detail.saveHeadcount')
            }
            variant="secondary"
            onPress={() => void saveHeadcount()}
            disabled={submitting}
          />
          <Button
            label={t('employer:jobs.detail.closeJob')}
            variant="destructive"
            onPress={() => void closeJob()}
            disabled={submitting}
          />
        </View>
      ) : (
        error ? (
          <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
        ) : null
      )}
    </ModulePage>
  );
}
