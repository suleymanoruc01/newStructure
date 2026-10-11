import React from 'react';
import { useTranslation } from 'react-i18next';

import { Screen } from '../../../components/ui/Screen';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { clearSystemRoute } from '../../../shared/system/system-route-store';
import { SessionExpiredCard } from '../components/SessionExpiredCard';

export function SharedSessionExpiredScreen() {
  const { t } = useTranslation(['system']);
  const { signOut } = useAuth();

  return (
    <Screen testID="m.shared.system.session-expired">
      <SessionExpiredCard
        title={t('system:sessionExpired.title')}
        body={t('system:sessionExpired.body')}
        ctaLabel={t('system:sessionExpired.reauth')}
        onReauth={() => {
          clearSystemRoute();
          void signOut();
        }}
      />
    </Screen>
  );
}
