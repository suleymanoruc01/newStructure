import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { openInTab } from '../../../app/navigation/dock-routes';
import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { listBranches } from '../../../api/branches-api';
import { listEmployerOpenDisputes } from '../../../api/shifts-api';
import { fetchTokenBalance } from '../../../api/tokens-api';
import { Button } from '../../../components/ui/Button';
import { NavRow } from '../../../components/ui/NavRow';
import { Screen } from '../../../components/ui/Screen';
import { HeroModule, SheetModule } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { useDisplayTimeZone } from '../../../shared/datetime/istanbul';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerHome'>;

type Summary = {
  available: number | null;
  held: number | null;
  branches: number | null;
  disputes: number | null;
};

export function EmployerHomeScreen({ navigation, route }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors', 'system']);
  const timeZone = useDisplayTimeZone();
  const testID = route.params?.screenId ?? 'm.employer.home.root';
  const [summary, setSummary] = useState<Summary>({
    available: null,
    held: null,
    branches: null,
    disputes: null,
  });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const token = getAccessToken();
    if (!token) {
      setError(t('errors:UNAUTHORIZED', { defaultValue: 'Oturum bulunamadı.' }));
      return;
    }
    const [balance, branches, disputes] = await Promise.allSettled([
      fetchTokenBalance(token),
      listBranches(token),
      listEmployerOpenDisputes(token),
    ]);
    setSummary({
      available: balance.status === 'fulfilled' ? balance.value.available : null,
      held: balance.status === 'fulfilled' ? balance.value.held : null,
      branches: branches.status === 'fulfilled' ? branches.value.items.length : null,
      disputes: disputes.status === 'fulfilled' ? disputes.value.items.length : null,
    });
    if (
      balance.status === 'rejected' &&
      branches.status === 'rejected' &&
      disputes.status === 'rejected'
    ) {
      setError(t('common:networkError'));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const eyebrow = new Intl.DateTimeFormat('tr-TR', {
    timeZone,
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <Screen bleed dock scroll testID={testID}>
      <HeroModule eyebrow={eyebrow} title={t('employer:home.title')} />
      <SheetModule>
        <Button
          label={t('employer:jobs.create')}
          onPress={() =>
            openInTab(navigation, 'EmployerCreateJob', ['EmployerJobs', 'ManagerJobs'])
          }
        />
        {error ? (
          <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
        ) : null}
        <View className="mt-4">
          <NavRow
            label={`${t('employer:home.tokenTile')} · ${summary.available == null ? '—' : summary.available}`}
            onPress={() => navigation.navigate('EmployerTokensRoot')}
          />
          <NavRow
            label={`${t('employer:home.branchTile')} · ${summary.branches == null ? '—' : summary.branches}`}
            onPress={() =>
              openInTab(navigation, 'EmployerBranches', [
                'EmployerBranches',
                'ManagerHome',
              ])
            }
          />
          <NavRow
            label={`${t('employer:home.disputeTile')} · ${summary.disputes == null ? '—' : summary.disputes}`}
            onPress={() => navigation.navigate('EmployerOpenDisputes')}
          />
        </View>
      </SheetModule>
    </Screen>
  );
}
