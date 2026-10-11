import type { UserRole } from '@parton/api-contracts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { Screen } from '../../../components/ui/Screen';
import { ApiClientError } from '../../../api/client';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { SCREEN_IDS } from '../screen-ids';

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthRoleSelect'>;

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

export function AuthRoleSelectScreen({ navigation }: Props) {
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const { selectRole, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.roles.length > 0) {
      navigation.replace('AuthPolicies');
    }
  }, [navigation, user]);

  const onSelect = async (role: UserRole) => {
    setSubmitting(true);
    setError(null);
    try {
      await selectRole(role);
      navigation.replace('AuthPolicies');
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
    <Screen scroll testID={SCREEN_IDS.roleSelect}>
      <Text className="text-2xl font-bold text-text-high">{t('auth:role.title')}</Text>
      <View className="mt-6 gap-3">
        {ROLES.map((item) => (
          <Pressable
            key={item.role}
            accessibilityRole="button"
            disabled={submitting}
            onPress={() => void onSelect(item.role)}
            className="rounded-2xl bg-surface-1 p-4 active:bg-surface-2"
          >
            <Text className="text-lg font-semibold text-forest">
              {t(`auth:${item.titleKey}`)}
            </Text>
            <Text className="mt-1 text-base text-text-medium">
              {t(`auth:${item.bodyKey}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      {error ? (
        <Text className="mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
    </Screen>
  );
}
