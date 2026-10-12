import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { TextField } from '../../../components/ui/TextField';
import { ApiClientError } from '../../../api/client';
import { createBranch } from '../../../api/branches-api';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { continueAfterGate } from '../../../shared/auth/auth-gate';
import { ONBOARDING_SCREEN_IDS } from '../screen-ids';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'EmployerOnboardingBranch'
>;

export function EmployerOnboardingBranchScreen({ navigation }: Props) {
  const { t } = useTranslation(['onboarding', 'common', 'errors']);
  const { completeOnboarding } = useAuth();
  const [name, setName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('41.0082');
  const [longitude, setLongitude] = useState('28.9784');
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
      const lat = Number.parseFloat(latitude);
      const lng = Number.parseFloat(longitude);
      await createBranch(
        {
          name,
          addressLine1,
          city,
          latitude: lat,
          longitude: lng,
        },
        token,
      );
      continueAfterGate(navigation, await completeOnboarding());
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
    <ModulePage title={t('onboarding:employer.branchTitle')} testID={ONBOARDING_SCREEN_IDS.employerBranch} scroll>
      
      <Text className="font-sans mt-2 text-base text-text-medium">
        {t('onboarding:employer.branchSubtitle')}
      </Text>
      <View className="mt-6 gap-3">
        <TextField label={t('onboarding:employer.branchName')} value={name} onChangeText={setName} />
        <TextField
          label={t('onboarding:employer.address')}
          value={addressLine1}
          onChangeText={setAddressLine1}
        />
        <TextField label={t('onboarding:employer.city')} value={city} onChangeText={setCity} />
        <TextField
          label={t('onboarding:employer.latitude')}
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="decimal-pad"
        />
        <TextField
          label={t('onboarding:employer.longitude')}
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="decimal-pad"
        />
      </View>
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-6">
        <Button
          disabled={submitting}
          label={t('onboarding:employer.finish')}
          onPress={() => void onSubmit()}
        />
      </View>
    </ModulePage>
  );
}
