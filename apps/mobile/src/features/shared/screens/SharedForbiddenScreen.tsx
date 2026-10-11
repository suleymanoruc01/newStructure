import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '../../../components/ui/Screen';
import { clearSystemRoute } from '../../../shared/system/system-route-store';
import { ForbiddenState } from '../components/ForbiddenState';
import { TenantMismatchExplain } from '../components/TenantMismatchExplain';

export function SharedForbiddenScreen() {
  const { t } = useTranslation(['system', 'common']);

  return (
    <Screen testID="m.shared.system.forbidden">
      <ForbiddenState
        title={t('system:forbidden.title')}
        body={t('system:forbidden.body')}
      />
      <TenantMismatchExplain hint={t('system:forbidden.tenantHint')} />
      <Pressable
        accessibilityRole="button"
        className="mt-8"
        onPress={() => clearSystemRoute()}
      >
        <Text className="text-center text-base font-semibold text-brand-primary">
          {t('common:back')}
        </Text>
      </Pressable>
    </Screen>
  );
}
