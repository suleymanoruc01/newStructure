import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { clearSystemRoute } from '../../../shared/system/system-route-store';

export function SharedForbiddenScreen() {
  const { t } = useTranslation(['system', 'common']);

  return (
    <ModulePage back="off" scroll={false} testID="m.shared.system.forbidden" title={t('system:forbidden.title')}>
      <Text className="font-sans text-base text-text-medium">
        {t('system:forbidden.body')}
      </Text>
      <Text className="font-sans mt-4 text-sm text-feedback-error">
        {t('system:forbidden.tenantHint')}
      </Text>
      <View className="mt-6">
        <Button label={t('common:back')} onPress={() => clearSystemRoute()} />
      </View>
    </ModulePage>
  );
}
