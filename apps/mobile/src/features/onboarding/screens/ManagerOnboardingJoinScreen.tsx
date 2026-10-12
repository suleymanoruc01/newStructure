import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { WizardShell } from '../../../components/ui/WizardShell';
import { TextField } from '../../../components/ui/TextField';
import { ApiClientError } from '../../../api/client';
import { managerJoin } from '../../../api/branches-api';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { continueAfterGate } from '../../../shared/auth/auth-gate';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { ONBOARDING_SCREEN_IDS } from '../screen-ids';

type Props = NativeStackScreenProps<AuthStackParamList, 'ManagerOnboardingJoin'>;

export function ManagerOnboardingJoinScreen({ navigation }: Props) {
  const { t } = useTranslation(['onboarding', 'common', 'errors']);
  const { applyManagerJoin, completeOnboarding } = useAuth();
  const [code, setCode] = useState('');
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
      const result = await managerJoin({ code: code.trim() }, token);
      applyManagerJoin(result);
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
    <ModulePage title={t('onboarding:manager.title')} testID={ONBOARDING_SCREEN_IDS.managerJoin} scroll>
      
      <WizardShell
        error={error}
        heading={t('onboarding:manager.title')}
        hint={t('onboarding:manager.subtitle')}
        primaryDisabled={submitting || code.trim().length < 6}
        primaryLabel={t('onboarding:manager.submit')}
        step={1}
        total={1}
        onPrimary={() => void onSubmit()}
      >
        <StatusBadge
          label={
            code.trim().length >= 6
              ? t('onboarding:manager.submit')
              : t('onboarding:manager.codeLabel')
          }
          tone={code.trim().length >= 6 ? 'strong' : 'warn'}
        />
        <TextField
          autoCapitalize="characters"
          label={t('onboarding:manager.codeLabel')}
          value={code}
          onChangeText={setCode}
        />
      </WizardShell>
    </ModulePage>
  );
}
