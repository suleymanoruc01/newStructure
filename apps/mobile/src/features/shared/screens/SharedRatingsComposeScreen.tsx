import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApiClientError } from '../../../api/client';
import { submitRating } from '../../../api/ratings-api';
import { Screen } from '../../../components/ui/Screen';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';
import type { WorkerStackParamList } from '../../../app/navigation/worker-types';

type Props = NativeStackScreenProps<
  WorkerStackParamList,
  'SharedRatingsCompose'
>;

const SCORES = [1, 2, 3, 4, 5] as const;

export function SharedRatingsComposeScreen({ route, navigation }: Props) {
  const { shiftId, counterpartLabel, jobTitle } = route.params;
  const { t } = useTranslation(['ratings', 'common', 'errors']);
  const [score, setScore] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await submitRating(token, {
        shiftId,
        score,
        comment: comment.trim() || undefined,
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
    <Screen scroll testID="m.shared.ratings.compose">
      <Text className="text-xl font-bold text-text-high">
        {t('ratings:compose.title')}
      </Text>
      {jobTitle ? (
        <Text className="mt-2 text-base text-text-high">{jobTitle}</Text>
      ) : null}
      <Text className="mt-1 text-sm text-text-medium">{counterpartLabel}</Text>
      <View className="mt-6 flex-row justify-between gap-2">
        {SCORES.map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            className={`flex-1 rounded-xl py-3 ${
              score === value ? 'bg-brand-primary' : 'bg-surface-1'
            }`}
            onPress={() => setScore(value)}
          >
            <Text
              className={`text-center font-semibold ${
                score === value ? 'text-white' : 'text-text-high'
              }`}
            >
              {value}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextField
        label={t('ratings:compose.comment')}
        multiline
        numberOfLines={4}
        onChangeText={setComment}
        value={comment}
      />
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Pressable
        className="mt-8 rounded-xl bg-brand-primary px-4 py-3"
        disabled={submitting}
        onPress={() => void onSubmit()}
      >
        <Text className="text-center text-base font-semibold text-white">
          {submitting ? t('common:loading') : t('ratings:compose.submit')}
        </Text>
      </Pressable>
    </Screen>
  );
}
