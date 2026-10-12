import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { patchMe } from '../../../api/auth-api';
import { ApiClientError } from '../../../api/client';
import { formErrorMessage } from '../../../api/form-error';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { getAccessToken } from '../../../shared/auth/session-memory';

type EmailRoute = {
  SharedAccountEmail: undefined;
};

type Props = NativeStackScreenProps<EmailRoute, 'SharedAccountEmail'>;

export function SharedAccountEmailScreen({ navigation }: Props) {
  const { t } = useTranslation(['system', 'common', 'errors']);
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSave = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const trimmed = email.trim();
      await patchMe(token, { email: trimmed.length > 0 ? trimmed : null });
      navigation.goBack();
    } catch (err) {
      setError(formErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModulePage title={t('system:email.title')} testID="m.auth.email" scroll>
      <Text className="font-sans mt-2 text-base text-text-medium">
        {t('system:email.lead')}
      </Text>
      {user?.email ? (
        <View className="mt-3">
          <JobCard title={t('system:email.label')}>
            <StatusBadge label={user.email} tone="strong" />
          </JobCard>
        </View>
      ) : null}
      <View className="mt-6 gap-3">
        <TextField
          label={t('system:email.label')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        {error ? (
          <Text className="font-sans text-sm text-feedback-error">{error}</Text>
        ) : null}
        <Button
          disabled={submitting}
          label={t('common:continue')}
          onPress={() => void onSave()}
        />
      </View>
    </ModulePage>
  );
}
