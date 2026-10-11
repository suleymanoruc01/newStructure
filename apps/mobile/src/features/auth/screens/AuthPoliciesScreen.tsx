import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { ApiClientError } from '../../../api/client';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { SCREEN_IDS } from '../screen-ids';

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthPolicies'>;

type PolicyRow = { id: string; title: string; required: boolean };

export function AuthPoliciesScreen({ navigation }: Props) {
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const { loadPendingPolicies, acceptAllPolicies, phase } = useAuth();
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await loadPendingPolicies();
      setPolicies(items);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setLoading(false);
    }
  }, [loadPendingPolicies, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onAccept = async () => {
    if (policies.length === 0) {
      await acceptAllPolicies([]);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await acceptAllPolicies(policies.map((p) => p.id));
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
    <ModulePage title={t('auth:policies.title')} testID={SCREEN_IDS.policies} scroll>
      
      <Text className="font-sans mt-2 text-base text-text-medium">
        {t('auth:policies.subtitle')}
      </Text>
      {loading ? (
        <Text className="font-sans mt-6 text-text-medium">{t('common:loading')}</Text>
      ) : policies.length === 0 ? (
        <Text className="font-sans mt-6 text-text-medium">{t('auth:policies.empty')}</Text>
      ) : (
        <View className="mt-6 gap-2">
          {policies.map((p) => (
            <View key={p.id} className="rounded-xl bg-surface-1 p-4">
              <Text className="font-sans text-base font-medium text-text-high">
                {p.title}
              </Text>
              {p.required ? (
                <Text className="font-sans mt-1 text-sm text-text-low">Zorunlu</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-6 gap-3">
        <Button
          disabled={submitting || loading}
          label={t('auth:policies.acceptAll')}
          onPress={() => void onAccept()}
        />
        {phase === 'unauthenticated' ? (
          <Button
            label={t('common:back')}
            onPress={() => navigation.goBack()}
            variant="secondary"
          />
        ) : null}
      </View>
    </ModulePage>
  );
}
