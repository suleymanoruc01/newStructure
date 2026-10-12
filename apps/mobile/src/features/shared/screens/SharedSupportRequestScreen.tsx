import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApiClientError } from '../../../api/client';
import { createSupportTicket } from '../../../api/support-api';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { StatStrip } from '../../../components/ui/StatStrip';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { Pressable } from '../../../components/ui/Pressable';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';

type SupportRoute = {
  SharedSupportRequest: undefined;
};

type Props = NativeStackScreenProps<SupportRoute, 'SharedSupportRequest'>;

export function SharedSupportRequestScreen({ navigation }: Props) {
  const { t } = useTranslation(['system', 'common', 'errors']);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();
    if (trimmedSubject.length < 3) {
      setError(t('system:support.subjectTooShort'));
      return;
    }
    if (trimmedBody.length < 10) {
      setError(t('system:support.bodyTooShort'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await createSupportTicket(token, {
        subject: trimmedSubject,
        body: trimmedBody,
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
    <ModulePage title={t('system:support.title')} testID="m.shared.support.request" scroll>
      <Text className="font-sans mt-2 text-sm text-text-medium">{t('system:support.lead')}</Text>
      <View className="mt-3">
        <StatStrip
          items={[
            {
              label: t('system:support.subjectLabel'),
              value: String(subject.trim().length),
            },
            {
              label: t('system:support.bodyLabel'),
              value: String(body.trim().length),
            },
          ]}
        />
      </View>
      <View className="mt-2">
        <StatusBadge
          label={
            subject.trim().length >= 3 && body.trim().length >= 10
              ? t('system:support.submit')
              : t('system:support.bodyTooShort')
          }
          tone={
            subject.trim().length >= 3 && body.trim().length >= 10
              ? 'strong'
              : 'warn'
          }
        />
      </View>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {(
          [
            t('system:support.chipTokens'),
            t('system:support.chipShift'),
            t('system:support.chipAccount'),
          ] as const
        ).map((label) => (
          <Pressable
            key={label}
            className={`rounded-full px-3 py-2 ${
              subject === label ? 'bg-action-primary' : 'bg-surface-1'
            }`}
            onPress={() => setSubject(label)}
          >
            <Text
              className={`font-sans text-sm ${
                subject === label ? 'text-text-on' : 'text-text-high'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextField
        label={t('system:support.subjectLabel')}
        onChangeText={setSubject}
        value={subject}
      />
      <TextField
        label={t('system:support.bodyLabel')}
        multiline
        numberOfLines={6}
        onChangeText={setBody}
        value={body}
      />
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Button
        className="mt-8"
        disabled={submitting}
        label={submitting ? t('common:loading') : t('system:support.submit')}
        onPress={() => void onSubmit()}
        testID="SupportRequestSubmitButton"
      />
    </ModulePage>
  );
}
