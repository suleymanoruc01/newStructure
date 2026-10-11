import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { fetchWorkerProfile } from '../../../api/workers-api';
import { Button } from '../../../components/ui/Button';
import { NavRow } from '../../../components/ui/NavRow';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { confirmDestructive } from '../../../shared/ui/confirm-destructive';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerProfileRoot'>;

export function WorkerProfileRootScreen({ navigation }: Props) {
  const { t } = useTranslation(['worker', 'common', 'errors', 'system']);
  const { signOut } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [complete, setComplete] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const profile = await fetchWorkerProfile(token);
      setFirstName(profile.firstName ?? '');
      setLastName(profile.lastName ?? '');
      setComplete(profile.profileComplete);
      setMissing(profile.completionMissing ?? []);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    t('worker:profile.unnamed');

  return (
    <ModulePage title={t('worker:profile.title')} testID="m.worker.profile.root" scroll dock>
      
      <View className="mt-6 rounded-2xl bg-surface-1 p-4">
        <Text className="font-display text-xl font-semibold text-text-high">
          {displayName}
        </Text>
        {!complete && missing.length > 0 ? (
          <Text className="font-sans mt-2 text-sm text-feedback-error">
            {missing
              .map((key) => t(`worker:profile.missing.${key}`, { defaultValue: key }))
              .join(', ')}
          </Text>
        ) : null}
      </View>
      <View className="mt-6">
        <Button
          label={t('worker:profile.editCta')}
          onPress={() => navigation.navigate('WorkerProfileEdit')}
        />
      </View>
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-4">
        <NavRow
          label={t('worker:jobs.navApplications')}
          onPress={() => navigation.navigate('WorkerApplicationsList')}
        />
        <NavRow
          label={t('worker:jobs.navFavorites')}
          onPress={() => navigation.navigate('WorkerFavoritesList')}
        />
        <NavRow
          label={t('worker:jobs.navDocuments')}
          onPress={() => navigation.navigate('WorkerDocumentsList')}
        />
        <NavRow
          label={t('system:notifications.title')}
          onPress={() => navigation.navigate('SharedNotificationsList')}
        />
        <NavRow
          label={t('system:abuse.title')}
          onPress={() => navigation.navigate('SharedAbuseReport')}
        />
        <NavRow
          label={t('worker:jobs.navRatings')}
          onPress={() => navigation.navigate('SharedRatingsPending')}
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
