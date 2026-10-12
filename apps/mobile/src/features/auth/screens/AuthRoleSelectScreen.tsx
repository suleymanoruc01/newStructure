import type { UserRole } from '@parton/api-contracts';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { JobCard } from '../../../components/job/JobCard';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { ApiClientError } from '../../../api/client';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { SCREEN_IDS } from '../screen-ids';

type RoleCard = {
  role: UserRole;
  titleKey: string;
  bodyKey: string;
};

const ROLES: RoleCard[] = [
  { role: 'worker', titleKey: 'role.workerTitle', bodyKey: 'role.workerBody' },
  { role: 'employer', titleKey: 'role.employerTitle', bodyKey: 'role.employerBody' },
  { role: 'manager', titleKey: 'role.managerTitle', bodyKey: 'role.managerBody' },
];

export function AuthRoleSelectScreen() {
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const { selectRole } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSelect = async (role: UserRole) => {
    setSubmitting(true);
    setError(null);
    try {
      await selectRole(role);
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
    <ModulePage scroll testID={SCREEN_IDS.roleSelect} title={t('auth:role.title')}>
      <View className="gap-3">
        {ROLES.map((item) => (
          <JobCard
            key={item.role}
            disabled={submitting}
            title={t(`auth:${item.titleKey}`)}
            onPress={() => void onSelect(item.role)}
          >
            <Text className="font-sans text-base leading-5 text-text-medium">
              {t(`auth:${item.bodyKey}`)}
            </Text>
          </JobCard>
        ))}
      </View>
      {error ? <Text className="font-sans text-sm text-feedback-error">{error}</Text> : null}
    </ModulePage>
  );
}
