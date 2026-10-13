import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { statusLabelTr } from '@parton/api-contracts';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { listMyApplications } from '../../../api/applications-api';
import { fetchJobCatalog } from '../../../api/jobs-api';
import { listMyShifts } from '../../../api/shifts-api';
import { listFavorites } from '../../../api/favorites-api';
import { listWorkerDocuments } from '../../../api/worker-documents-api';
import {
  fetchWorkerAvailability,
  fetchWorkerProfile,
} from '../../../api/workers-api';
import { ApplicantFacts } from '../../../components/application/ApplicantFacts';
import { LocationMap } from '../../../components/map/LocationMap';
import { openInTab } from '../../../app/navigation/dock-routes';
import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { NavRow } from '../../../components/ui/NavRow';
import { ProfileCompletionMeter } from '../../../components/ui/ProfileCompletionMeter';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { StatusBadge, statusTone } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { getAccessToken } from '../../../shared/auth/session-memory';
import {
  DAY_NAMES_TR,
  formatMinuteOfDay,
} from '../../../shared/availability/time-minutes';
import { weekdaySun0 } from '../../../shared/datetime/istanbul';
import { confirmDestructive } from '../../../shared/ui/confirm-destructive';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerProfileRoot'>;

export function WorkerProfileRootScreen({ navigation }: Props) {
  const { t } = useTranslation(['worker', 'employer', 'common', 'errors', 'system']);
  const { signOut } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [complete, setComplete] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Awaited<
    ReturnType<typeof fetchWorkerProfile>
  > | null>(null);
  const [sectors, setSectors] = useState<
    Awaited<ReturnType<typeof fetchJobCatalog>>['sectors']
  >([]);
  const [completedShifts, setCompletedShifts] = useState<number | null>(null);
  const [applicationCount, setApplicationCount] = useState<number | null>(null);
  const [documentCount, setDocumentCount] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<
    Awaited<ReturnType<typeof listFavorites>>['items']
  >([]);
  const [windows, setWindows] = useState<
    Awaited<ReturnType<typeof fetchWorkerAvailability>>['windows']
  >([]);
  const [documents, setDocuments] = useState<
    Awaited<ReturnType<typeof listWorkerDocuments>>['items']
  >([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await fetchWorkerProfile(token);
      setProfile(data);
      setFirstName(data.firstName ?? '');
      setLastName(data.lastName ?? '');
      setComplete(data.profileComplete);
      setMissing(data.completionMissing ?? []);
      const [catalog, shifts, applications, docs, favs, availability] =
        await Promise.allSettled([
          fetchJobCatalog(),
          listMyShifts(token),
          listMyApplications(token),
          listWorkerDocuments(token),
          listFavorites(token),
          fetchWorkerAvailability(token),
        ]);
      if (catalog.status === 'fulfilled') {
        setSectors(catalog.value.sectors ?? []);
      }
      if (shifts.status === 'fulfilled') {
        setCompletedShifts(
          (shifts.value.items ?? []).filter((shift) => shift.status === 'completed')
            .length,
        );
      }
      if (applications.status === 'fulfilled') {
        setApplicationCount((applications.value.items ?? []).length);
      }
      if (docs.status === 'fulfilled') {
        setDocumentCount((docs.value.items ?? []).length);
        setDocuments(docs.value.items ?? []);
      }
      if (favs.status === 'fulfilled') {
        setFavorites(favs.value.items ?? []);
      }
      if (availability.status === 'fulfilled') {
        setWindows(availability.value.windows ?? []);
      }
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
      
      {!profile && !error ? (
        <View className="mt-6">
          <SkeletonList rows={2} />
        </View>
      ) : null}
      {profile ? (
      <View className="mt-6">
      <JobCard title={displayName}>
        <StatusBadge
          label={
            complete
              ? t('worker:profile.statusComplete')
              : t('worker:profile.statusIncomplete')
          }
          tone={complete ? 'strong' : 'warn'}
        />
        {profile.publicCode ? (
          <View className="mt-2">
            <StatusBadge
              label={t('worker:profile.publicCode', { code: profile.publicCode })}
              tone="neutral"
            />
          </View>
        ) : null}
        {complete ? (
          <Text className="font-sans mt-2 text-sm text-text-medium">
            {t('worker:profile.complete')}
          </Text>
        ) : missing.length > 0 ? (
          <Text className="font-sans mt-2 text-sm text-feedback-error">
            {missing
              .map((key) => t(`worker:profile.missing.${key}`, { defaultValue: key }))
              .join(', ')}
          </Text>
        ) : null}
        {profile?.nightShiftAvailable ? (
          <View className="mt-2">
            <StatusBadge
              label={t('worker:profile.nightShift')}
              tone="strong"
            />
          </View>
        ) : null}
        {profile ? (
          <View className="mt-3">
            <ApplicantFacts snapshot={profile} sectors={sectors} />
          </View>
        ) : null}
        <ProfileCompletionMeter complete={complete} missing={missing} />
        <View className="mt-3">
          <StatStrip
            items={[
              {
                label: t('worker:profile.statShifts'),
                value:
                  completedShifts == null ? '—' : String(completedShifts),
              },
              {
                label: t('worker:profile.statApplications'),
                value:
                  applicationCount == null ? '—' : String(applicationCount),
              },
              {
                label: t('worker:profile.statDocuments'),
                value: documentCount == null ? '—' : String(documentCount),
              },
            ]}
          />
        </View>
      </JobCard>
      </View>
      ) : null}
      {missing.length > 0 ? (
        <View className="mt-4 gap-2">
          {missing.map((key) => (
            <JobCard
              key={key}
              title={t(`worker:profile.missing.${key}`, { defaultValue: key })}
              onPress={() =>
                key === 'availability'
                  ? openInTab(
                      navigation,
                      'WorkerAvailabilityEdit',
                      ['WorkerCalendar'],
                    )
                  : navigation.navigate('WorkerProfileEdit')
              }
            >
              <StatusBadge label={t('worker:profile.editCta')} tone="warn" />
            </JobCard>
          ))}
        </View>
      ) : null}
      {windows.length > 0 ? (
        <View className="mt-4 gap-2">
          <StatStrip
            items={[
              {
                label: t('worker:calendar.today'),
                value: String(
                  windows.filter(
                    (window) => window.dayOfWeek === weekdaySun0(),
                  ).length,
                ),
              },
              {
                label: t('worker:availability.statWindows'),
                value: String(windows.length),
              },
            ]}
          />
          {windows.map((window, index) => (
            <JobCard
              key={`${window.dayOfWeek}-${window.startMinute}-${index}`}
              title={DAY_NAMES_TR[window.dayOfWeek]}
              onPress={() =>
                openInTab(
                  navigation,
                  'WorkerAvailabilityEdit',
                  ['WorkerCalendar'],
                )
              }
            >
              <Text className="font-sans text-sm text-text-medium">
                {formatMinuteOfDay(window.startMinute)} –{' '}
                {formatMinuteOfDay(window.endMinute)}
              </Text>
            </JobCard>
          ))}
        </View>
      ) : null}
      {documents.length > 0 ? (
        <View className="mt-4 gap-2">
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('worker:jobs.navDocuments')}
          </Text>
          {documents.map((doc) => (
            <JobCard
              key={doc.id}
              title={doc.fileName}
              onPress={() => navigation.navigate('WorkerDocumentsList')}
            >
              <StatusBadge
                label={t(`worker:documents.types.${doc.documentType}`)}
                tone="strong"
              />
              <View className="mt-2">
                <StatusBadge
                  label={statusLabelTr(doc.status)}
                  tone={statusTone(doc.status)}
                />
              </View>
            </JobCard>
          ))}
        </View>
      ) : null}
      {profile?.homeLatitude != null && profile.homeLongitude != null ? (
        <View className="mt-4">
          <LocationMap
            pin={{
              latitude: profile.homeLatitude,
              longitude: profile.homeLongitude,
            }}
            pinLabel={displayName}
          />
        </View>
      ) : null}
      {favorites.length > 0 ? (
        <View className="mt-4 gap-2">
          <Text className="font-sans text-sm font-semibold text-text-high">
            {t('worker:jobs.navFavorites')}
          </Text>
          {favorites.map((fav) => (
            <JobCard
              key={fav.id}
              title={fav.targetLabel ?? t('worker:favorites.title')}
              onPress={() => navigation.navigate('WorkerFavoritesList')}
            >
              {fav.mutual ? (
                <StatusBadge
                  label={t('employer:favorites.mutual')}
                  tone="strong"
                />
              ) : null}
            </JobCard>
          ))}
        </View>
      ) : null}
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
          label={t('worker:calendar.title')}
          onPress={() =>
            openInTab(navigation, 'WorkerCalendar', ['WorkerCalendar'])
          }
        />
        <NavRow
          label={t('worker:jobs.navAvailability')}
          onPress={() =>
            openInTab(navigation, 'WorkerAvailabilityEdit', ['WorkerCalendar'])
          }
        />
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
          label={t('system:support.title')}
          onPress={() => navigation.navigate('SharedSupportRequest')}
        />
        <NavRow
          label={t('worker:jobs.navRatings')}
          onPress={() => navigation.navigate('SharedRatingsPending')}
        />
        <NavRow
          label={t('worker:revenue.title')}
          onPress={() => navigation.navigate('WorkerRevenue')}
        />
        <NavRow
          label={t('system:settings.title')}
          onPress={() => navigation.navigate('SharedSettings')}
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
