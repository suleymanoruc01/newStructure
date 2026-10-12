import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { NavRow } from '../../../components/ui/NavRow';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { requestAccountDeletion } from '../../../api/auth-api';
import { ApiClientError } from '../../../api/client';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { confirmDestructive } from '../../../shared/ui/confirm-destructive';

type SettingsRoute = {
  SharedSettings: undefined;
  SharedAccountEmail: undefined;
  SharedNotificationsList: undefined;
  SharedNotificationPrefs: undefined;
  SharedSupportRequest: undefined;
};

type Props = NativeStackScreenProps<SettingsRoute, 'SharedSettings'>;

export function SharedSettingsScreen({ navigation }: Props) {
  const { t } = useTranslation(['system', 'common', 'errors']);
  const { user } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const onDelete = async () => {
    const confirmed = await confirmDestructive(
      t('system:settings.deleteTitle'),
      t('system:settings.deleteBody'),
      t('system:settings.deleteCta'),
      t('common:cancel'),
    );
    if (!confirmed) {
      return;
    }
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await requestAccountDeletion(token);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    }
  };

  return (
    <ModulePage
      title={t('system:settings.title')}
      testID="m.shared.profile.settings"
      scroll
    >
      {user?.phone ? (
        <View className="mt-2">
          <JobCard title={t('system:settings.phone')}>
            <StatusBadge
              label={user.phone}
              tone="strong"
            />
            {user.email ? (
              <View className="mt-2">
                <StatusBadge label={user.email} tone="neutral" />
              </View>
            ) : null}
            {user.deletionRequestedAt ? (
              <View className="mt-2">
                <StatusBadge
                  label={t('system:settings.deleteRequested')}
                  tone="error"
                />
              </View>
            ) : null}
          </JobCard>
        </View>
      ) : user?.deletionRequestedAt ? (
        <View className="mt-3">
          <StatusBadge
            label={t('system:settings.deleteRequested')}
            tone="error"
          />
        </View>
      ) : null}
      <NavRow
        label={t('system:settings.email')}
        onPress={() => navigation.navigate('SharedAccountEmail')}
      />
      <NavRow
        label={t('system:notifications.title')}
        onPress={() => navigation.navigate('SharedNotificationsList')}
      />
      <NavRow
        label={t('system:notifications.prefs')}
        onPress={() => navigation.navigate('SharedNotificationPrefs')}
      />
      <NavRow
        label={t('system:support.title')}
        onPress={() => navigation.navigate('SharedSupportRequest')}
      />
      {user?.deletionRequestedAt ? null : (
        <View className="mt-8">
          <Button
            label={t('system:settings.deleteCta')}
            variant="destructive"
            onPress={() => void onDelete()}
          />
        </View>
      )}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
    </ModulePage>
  );
}
