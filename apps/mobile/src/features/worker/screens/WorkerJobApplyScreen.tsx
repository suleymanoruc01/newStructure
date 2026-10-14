import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { applyToJob } from '../../../api/applications-api';
import { ApiClientError } from '../../../api/client';
import { fetchJobDetail } from '../../../api/jobs-api';
import { JobCard } from '../../../components/job/JobCard';
import { JobFacts } from '../../../components/job/JobFacts';
import { Button } from '../../../components/ui/Button';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import {
  OverlapConflictCard,
  type OverlapConflict,
} from '../components/OverlapConflictCard';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { triggerHaptic } from '../../../shared/ui/haptics';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerJobApply'>;

function conflictsFromError(err: ApiClientError): OverlapConflict[] {
  if (!err.details?.length) {
    return [];
  }
  return err.details
    .filter((d) => d.code === 'overlap' && d.path)
    .map((d) => ({
      applicationId: d.path!,
      jobId: d.jobId,
      startsAt: d.startsAt,
      endsAt: d.endsAt,
    }));
}

export function WorkerJobApplyScreen({ route, navigation }: Props) {
  const { jobId } = route.params ?? { jobId: '' };
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [error, setError] = useState<string | null>(null);
  const [overlapAck, setOverlapAck] = useState(false);
  const [conflicts, setConflicts] = useState<OverlapConflict[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof fetchJobDetail>
  > | null>(null);

  React.useEffect(() => {
    void (async () => {
      const token = getAccessToken();
      if (!token) {
        return;
      }
      setDetail(await fetchJobDetail(jobId, token));
    })();
  }, [jobId]);

  const onConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await applyToJob(
        jobId,
        token,
        { acknowledgeOverlap: overlapAck },
        `apply-${jobId}`,
      );
      triggerHaptic('success');
      navigation.popToTop();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === 'SCHEDULE_OVERLAP_WARN') {
          triggerHaptic('medium');
          setOverlapAck(true);
          setConflicts(conflictsFromError(err));
          setError(null);
        } else {
          triggerHaptic('error');
          setError(t(`errors:${err.code}`, { defaultValue: err.message }));
        }
      } else {
        triggerHaptic('error');
        setError(t('common:networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModulePage title={t('worker:apply.title')} testID="m.worker.jobs.apply-confirm" scroll>
      
      {!detail && !error ? (
        <View className="mt-4">
          <SkeletonList rows={2} />
        </View>
      ) : null}
      {detail ? (
        <View className="mt-2">
          <JobCard
            title={detail.title ?? detail.branchName ?? t('worker:jobs.untitled')}
          >
            {detail.eligibility ? (
              <View className="mb-2">
                <StatusBadge
                  label={
                    detail.eligibility.eligible
                      ? t('worker:jobs.eligible')
                      : t('worker:jobs.notEligible')
                  }
                  tone={detail.eligibility.eligible ? 'strong' : 'error'}
                />
              </View>
            ) : null}
            <JobFacts
              branchName={detail.branchName}
              startsAt={detail.startsAt}
              endsAt={detail.endsAt}
              payAmountMinor={detail.payAmountMinor}
              payCurrency={detail.payCurrency}
              distanceKm={detail.distanceKm}
              headcount={detail.headcount}
              remainingHeadcount={detail.remainingHeadcount}
              favoritesOnly={detail.favoritesOnly}
              instantAutoApprove={detail.instantAutoApprove}
              requiredDocumentTypes={detail.requiredDocumentTypes}
              amenities={detail.amenities}
            />
          </JobCard>
        </View>
      ) : null}
      {overlapAck ? (
        <OverlapConflictCard conflicts={conflicts} />
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Button
        className="mt-8"
        disabled={submitting}
        label={
          submitting
            ? t('common:loading')
            : overlapAck
              ? t('worker:apply.confirmDespiteOverlap')
              : t('worker:apply.confirm')
        }
        onPress={() => void onConfirm()}
        testID="ApplyConfirmSheet"
      />
    </ModulePage>
  );
}
