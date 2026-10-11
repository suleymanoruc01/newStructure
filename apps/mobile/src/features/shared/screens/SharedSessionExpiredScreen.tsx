import React from 'react';
import { useTranslation } from 'react-i18next';

import { ModulePage } from '../../../components/ui/ScreenModules';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { clearSystemRoute } from '../../../shared/system/system-route-store';
import { SessionExpiredCard } from '../components/SessionExpiredCard';

export function SharedSessionExpiredScreen() {
  const { t } = useTranslation(['system']);
  const { signOut } = useAuth();

  return (
    <ModulePage back="off" scroll={false} testID="m.shared.system.session-expired" title={t('system:sessionExpired.title')}>
      <SessionExpiredCard
        body={t('system:sessionExpired.body')}
        ctaLabel={t('system:sessionExpired.reauth')}
        onReauth={() => {
          clearSystemRoute();
          void signOut();
        }}
      />
    </ModulePage>
  );
}
