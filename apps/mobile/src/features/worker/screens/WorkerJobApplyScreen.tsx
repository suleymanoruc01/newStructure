import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text } from 'react-native';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { applyToJob } from '../../../api/applications-api';
import { ApiClientError } from '../../../api/client';
import { fetchJobDetail } from '../../../api/jobs-api';
import { ModulePage } from '../../../components/ui/ScreenModules';
import {
  OverlapConflictCard,
  type OverlapConflict,
} from '../components/OverlapConflictCard';
import { getAccessToken } from '../../../shared/auth/session-memory';

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
  const { jobId } = route.params;
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [error, setError] = useState<string | null>(null);
  const [overlapAck, setOverlapAck] = useState(false);
  const [conflicts, setConflicts] = useState<OverlapConflict[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      const token = getAccessToken();
      if (!token) {
        return;
      }
      const detail = await fetchJobDetail(jobId, token);
      setTitle(detail.title ?? detail.branchName ?? null);
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
      navigation.popToTop();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === 'SCHEDULE_OVERLAP_WARN') {
          setOverlapAck(true);
          setConflicts(conflictsFromError(err));
          setError(null);
        } else {
          setError(t(`errors:${err.code}`, { defaultValue: err.message }));
        }
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModulePage title={t('worker:apply.title')} testID="m.worker.jobs.apply-confirm" scroll>
      
      {title ? (
        <Text className="font-sans mt-2 text-base text-text-medium">{title}</Text>
      ) : null}
      {overlapAck ? (
        <OverlapConflictCard conflicts={conflicts} />
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Pressable
        className="mt-8 rounded-lg bg-action-primary px-4 py-3"
        disabled={submitting}
        onPress={() => void onConfirm()}
        testID="ApplyConfirmSheet"
      >
        <Text className="font-sans text-center text-base font-semibold text-text-on">
          {submitting
            ? t('common:loading')
            : overlapAck
              ? t('worker:apply.confirmDespiteOverlap')
              : t('worker:apply.confirm')}
        </Text>
      </Pressable>
    </ModulePage>
  );
}
