import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { ApiClientError } from '../../../api/client';
import { fetchTokenBalance, fetchTokenLedger } from '../../../api/tokens-api';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerTokensRoot'>;

export function EmployerTokensRootScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [available, setAvailable] = useState(0);
  const [held, setHeld] = useState(0);
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<
    { id: string; type: string; amount: number; createdAt: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const [bal, led] = await Promise.all([
        fetchTokenBalance(token),
        fetchTokenLedger(token),
      ]);
      setAvailable(bal.available);
      setHeld(bal.held);
      setBalance(bal.balance);
      setLedger(led.items.slice(0, 20));
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <ModulePage title={t('employer:tokens.title')} testID="m.employer.tokens.root" scroll>
      
      <Text className="font-sans text-base text-text-high">
        {t('employer:tokens.available')}: {available}
      </Text>
      <Text className="font-sans mt-1 text-sm text-text-medium">
        {t('employer:tokens.balanceHeld', { balance, held })}
      </Text>
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-4">
        <Button
          label={t('employer:tokens.topUpCta')}
          onPress={() => navigation.navigate('EmployerTokenTopUp')}
        />
      </View>
      <View className="mt-3 gap-2">
        {ledger.length === 0 ? (
          <Text className="font-sans text-sm text-text-medium">
            {t('employer:tokens.historyEmpty')}
          </Text>
        ) : (
          ledger.map((row) => (
            <View key={row.id} className="rounded-xl bg-surface-1 px-4 py-3">
              <Text className="font-sans text-sm font-medium text-text-high">
                {t(`employer:tokens.ledgerType.${row.type}`, {
                  defaultValue: row.type,
                })}
              </Text>
              <Text className="font-sans mt-1 text-sm text-text-medium">
                {row.amount > 0 ? `+${row.amount}` : row.amount}
              </Text>
            </View>
          ))
        )}
      </View>
    </ModulePage>
  );
}
