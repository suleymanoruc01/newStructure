import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { statusLabelTr } from '@parton/api-contracts';
import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import { formErrorMessage } from '../../../api/form-error';
import { fetchJobDetail, patchEmployerJob } from '../../../api/jobs-api';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { confirmDestructive } from '../../../shared/ui/confirm-destructive';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerJobDetail'>;

export function EmployerJobDetailScreen({ navigation, route }: Props) {
  const { jobId } = route.params;
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('');
  const [headcount, setHeadcount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const job = await fetchJobDetail(jobId, token);
      setTitle(job.title ?? job.id);
      setStatus(job.status);
      setHeadcount(String(job.headcount));
    } catch (err) {
      setError(formErrorMessage(err, t));
    }
  }, [jobId, t]);

  useEffect(() => {
    void load();
  }, [load]);

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
      
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {statusLabelTr(status)}
      </Text>
      {published ? (
        <View className="mt-6 gap-3">
          <TextField
            label={t('employer:jobs.headcount')}
            value={headcount}
            onChangeText={setHeadcount}
            keyboardType="number-pad"
          />
          {error ? (
            <Text className="font-sans text-sm text-feedback-error">{error}</Text>
          ) : null}
          <Button
            label={
              submitting
                ? t('common:loading')
                : t('employer:jobs.detail.saveHeadcount')
            }
            onPress={() => void saveHeadcount()}
            disabled={submitting}
          />
          <Button
            label={t('employer:jobs.detail.closeJob')}
            variant="destructive"
            onPress={() => void closeJob()}
            disabled={submitting}
          />
          <Button
            label={t('employer:jobs.applicants')}
            variant="secondary"
            onPress={() =>
              navigation.navigate('EmployerApplicants', {
                jobId,
                jobTitle: title,
              })
            }
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
