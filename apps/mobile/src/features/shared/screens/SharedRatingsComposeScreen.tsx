import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';

import { ApiClientError } from '../../../api/client';
import { submitRating } from '../../../api/ratings-api';
import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { clayCard } from '../../../components/ui/clay';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
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
    <ModulePage title={t('ratings:compose.title')} testID="m.shared.ratings.compose" scroll>
      
      <View className="mt-2">
        <JobCard title={jobTitle ?? t('ratings:pending.untitled')}>
          <Text className="font-sans text-sm text-text-medium">
            {counterpartLabel}
          </Text>
        </JobCard>
      </View>
      <View className="mt-4">
        <StatusBadge
          label={t(`ratings:compose.score.${score}`)}
          tone="strong"
        />
      </View>
      <View className="mt-3 flex-row justify-between gap-2">
        {SCORES.map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            style={clayCard}
            className={`flex-1 rounded-[22px] py-3 ${
              score === value ? 'bg-accent-mustard' : 'bg-surface-1'
            }`}
            onPress={() => setScore(value)}
          >
            <Text className="font-sans text-center font-semibold text-text-high">
              {value}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {(
          [
            t('ratings:compose.chipOnTime'),
            t('ratings:compose.chipClear'),
            t('ratings:compose.chipAgain'),
          ] as const
        ).map((label) => (
          <Pressable
            key={label}
            className={`rounded-full px-3 py-2 ${
              comment === label ? 'bg-action-primary' : 'bg-surface-1'
            }`}
            onPress={() => setComment(label)}
          >
            <Text
              className={`font-sans text-sm ${
                comment === label ? 'text-text-on' : 'text-text-high'
              }`}
            >
              {label}
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
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Button
        className="mt-8"
        disabled={submitting}
        label={submitting ? t('common:loading') : t('ratings:compose.submit')}
        onPress={() => void onSubmit()}
      />
    </ModulePage>
  );
}
