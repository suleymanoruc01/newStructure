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
    <ModulePage
      eyebrow="PartOn"
      hero={
        <Text className="mt-3 font-sans text-base leading-6 text-text-on">
          {t('auth:policies.subtitle')}
        </Text>
      }
      scroll
      testID={SCREEN_IDS.policies}
      title={t('auth:policies.title')}
    >
      {loading ? (
        <Text className="font-sans text-text-medium">{t('common:loading')}</Text>
      ) : policies.length === 0 ? (
        <Text className="font-sans text-text-medium">{t('auth:policies.empty')}</Text>
      ) : (
        <View className="gap-2">
          {policies.map((p) => (
            <View key={p.id} className="rounded-[22px] bg-surface-1 p-4">
              <Text className="font-sans text-base font-medium text-text-high">{p.title}</Text>
              {p.required ? (
                <Text className="font-sans mt-1 text-sm text-text-low">Zorunlu</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
      {error ? <Text className="font-sans text-sm text-feedback-error">{error}</Text> : null}
      <Button
        disabled={submitting || loading}
        label={t('auth:policies.acceptAll')}
        onPress={() => void onAccept()}
        shape="capsule"
      />
      {phase === 'unauthenticated' ? (
        <Button
          label={t('common:back')}
          onPress={() => navigation.goBack()}
          variant="ghost"
        />
      ) : null}
    </ModulePage>
  );
}
