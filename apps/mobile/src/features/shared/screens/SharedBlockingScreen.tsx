import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { statusLabelTr } from '@parton/api-contracts';
import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { StatusBadge, statusTone } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { useAuth } from '../../../shared/auth/AuthProvider';

export function SharedBlockingScreen() {
  const { t } = useTranslation(['system', 'common']);
  const { signOut, user } = useAuth();
  const status = user?.status ?? 'banned';

  return (
    <ModulePage
      back="off"
      scroll={false}
      testID="m.shared.system.blocking"
      title={t('system:blocking.title')}
    >
      <View className="mt-2">
        <JobCard title={t('system:blocking.title')}>
          <StatusBadge
            label={statusLabelTr(status)}
            tone={statusTone(status)}
          />
          <Text className="font-sans mt-2 text-base text-text-medium">
            {t('system:blocking.body')}
          </Text>
        </JobCard>
      </View>
      <View className="mt-6">
        <Button label={t('common:signOut')} onPress={() => void signOut()} />
      </View>
    </ModulePage>
  );
}
