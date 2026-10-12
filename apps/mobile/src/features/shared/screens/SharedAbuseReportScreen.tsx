import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ABUSE_REPORT_CATEGORIES, type ModerationReportCreate } from '@parton/api-contracts';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApiClientError } from '../../../api/client';
import { createModerationReport } from '../../../api/moderation-api';
import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { StatStrip } from '../../../components/ui/StatStrip';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';

type AbuseRoute = {
  SharedAbuseReport: { targetUserId?: string } | undefined;
};

type Props = NativeStackScreenProps<AbuseRoute, 'SharedAbuseReport'>;

export function SharedAbuseReportScreen({ route, navigation }: Props) {
  const { t } = useTranslation(['system', 'common', 'errors']);
  const [category, setCategory] = useState<ModerationReportCreate['category'] | null>(
    null,
  );
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const trimmed = note.trim();
    if (!category) {
      setError(t('system:abuse.categoryRequired'));
      return;
    }
    if (trimmed.length < 10) {
      setError(t('system:abuse.noteTooShort'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await createModerationReport(token, {
        category,
        note: trimmed,
        targetUserId: route.params?.targetUserId,
      });
      navigation.goBack();
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

  return (
    <ModulePage title={t('system:abuse.title')} testID="m.shared.abuse.report" scroll>
      
      <Text className="font-sans mt-2 text-sm text-text-medium">{t('system:abuse.lead')}</Text>
      <View className="mt-3 gap-2">
        {ABUSE_REPORT_CATEGORIES.map((id) => (
          <JobCard
            key={id}
            title={t(`system:abuse.categories.${id}`)}
            onPress={() => setCategory(id)}
          >
            {category === id ? (
              <StatusBadge label={t('common:yes')} tone="strong" />
            ) : null}
          </JobCard>
        ))}
      </View>
      <View className="mt-3">
        <StatStrip
          items={[
            {
              label: t('system:abuse.noteLabel'),
              value: String(note.trim().length),
            },
          ]}
        />
      </View>
      <TextField
        label={t('system:abuse.noteLabel')}
        multiline
        numberOfLines={5}
        onChangeText={setNote}
        value={note}
      />
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Button
        className="mt-8"
        disabled={submitting}
        label={submitting ? t('common:loading') : t('system:abuse.submit')}
        onPress={() => void onSubmit()}
        testID="AbuseReportSubmitButton"
      />
    </ModulePage>
  );
}
