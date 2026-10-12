import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { clearSystemRoute } from '../../../shared/system/system-route-store';

export function SharedForbiddenScreen() {
  const { t } = useTranslation(['system', 'common']);

  return (
    <ModulePage back="off" scroll={false} testID="m.shared.system.forbidden" title={t('system:forbidden.title')}>
      <View className="mt-2">
        <JobCard title={t('system:forbidden.title')}>
          <StatusBadge label={t('system:forbidden.title')} tone="error" />
          <Text className="font-sans mt-2 text-base text-text-medium">
            {t('system:forbidden.body')}
          </Text>
          <Text className="font-sans mt-2 text-sm text-feedback-error">
            {t('system:forbidden.tenantHint')}
          </Text>
        </JobCard>
      </View>
      <View className="mt-6">
        <Button label={t('common:back')} onPress={() => clearSystemRoute()} />
      </View>
    </ModulePage>
  );
}
