import type { UserRole } from '@parton/api-contracts';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';

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
      {ROLES.map((item) => (
        <Pressable
          key={item.role}
          accessibilityRole="button"
          disabled={submitting}
          onPress={() => void onSelect(item.role)}
          className="flex-row items-center rounded-[22px] bg-surface-1 px-4 py-4"
        >
          <View className="flex-1">
            <Text className="font-display text-lg font-semibold text-text-high">
              {t(`auth:${item.titleKey}`)}
            </Text>
            <Text className="font-sans mt-1 text-base leading-5 text-text-medium">
              {t(`auth:${item.bodyKey}`)}
            </Text>
          </View>
          <Text className="ml-3 font-sans text-xl text-text-low">›</Text>
        </Pressable>
      ))}
      {error ? <Text className="font-sans text-sm text-feedback-error">{error}</Text> : null}
    </ModulePage>
  );
}
