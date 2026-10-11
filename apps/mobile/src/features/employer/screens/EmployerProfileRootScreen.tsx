import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { Button } from '../../../components/ui/Button';
import { NavRow } from '../../../components/ui/NavRow';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { confirmDestructive } from '../../../shared/ui/confirm-destructive';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerProfileRoot'>;

export function EmployerProfileRootScreen({ navigation, route }: Props) {
  const { t } = useTranslation(['employer', 'common', 'system']);
  const { signOut } = useAuth();
  const testID = route.params?.screenId ?? 'm.employer.profile.root';

  return (
    <ModulePage title={t('employer:profile.title')} testID={testID} scroll dock>
      
      <View className="mt-4">
        <NavRow
          label={t('employer:jobs.navVerification')}
          onPress={() => navigation.navigate('EmployerVerificationStatus')}
        />
        <NavRow
          label={t('employer:tokens.title')}
          onPress={() => navigation.navigate('EmployerTokensRoot')}
        />
        <NavRow
          label={t('employer:jobs.navFavorites')}
          onPress={() => navigation.navigate('EmployerFavoriteWorkers')}
        />
        <NavRow
          label={t('employer:jobs.navDisputes')}
          onPress={() => navigation.navigate('EmployerOpenDisputes')}
        />
        <NavRow
          label={t('employer:jobs.navRatings')}
          onPress={() => navigation.navigate('SharedRatingsPending')}
        />
        <NavRow
          label={t('system:notifications.title')}
          onPress={() => navigation.navigate('SharedNotificationsList')}
        />
      </View>
      <View className="mt-8">
        <Button
          label={t('common:signOut')}
          onPress={() => {
            void (async () => {
              const confirmed = await confirmDestructive(
                t('common:signOut'),
                t('common:signOutBody'),
                t('common:signOut'),
                t('common:cancel'),
              );
              if (confirmed) {
                await signOut();
              }
            })();
          }}
          variant="secondary"
        />
      </View>
    </ModulePage>
  );
}
