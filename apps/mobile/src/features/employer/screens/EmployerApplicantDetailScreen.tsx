import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import {
  acceptApplication,
  getApplication,
  moveApplicationToSubstitute,
  rejectApplication,
  removeApplicationSubstitute,
  revokeAcceptApplication,
} from '../../../api/applications-api';
import { createFavorite } from '../../../api/favorites-api';
import { fetchJobCatalog } from '../../../api/jobs-api';
import { ApiClientError } from '../../../api/client';
import { ApplicantFacts } from '../../../components/application/ApplicantFacts';
import { JobCard } from '../../../components/job/JobCard';
import { JobFacts } from '../../../components/job/JobFacts';
import { Button } from '../../../components/ui/Button';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';
import {
  formatIstanbul,
  useDisplayTimeZone,
} from '../../../shared/datetime/istanbul';

type CatalogSector = Awaited<ReturnType<typeof fetchJobCatalog>>['sectors'][number];

type Props = NativeStackScreenProps<
  EmployerStackParamList,
  'EmployerApplicantDetail'
>;

export function EmployerApplicantDetailScreen({ route, navigation }: Props) {
  const { applicationId, jobTitle } = route.params ?? {
    applicationId: '',
    jobTitle: null,
  };
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const timeZone = useDisplayTimeZone();
  const [item, setItem] = useState<
    Awaited<ReturnType<typeof getApplication>> | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [sectors, setSectors] = useState<CatalogSector[]>([]);

  useEffect(() => {
    void fetchJobCatalog()
      .then((catalog) => setSectors(catalog.sectors ?? []))
      .catch(() => setError(t('common:networkError')));
  }, [t]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      setItem(await getApplication(applicationId, token));
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    }
  }, [applicationId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const run = async (fn: (token: string) => Promise<unknown>) => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await fn(token);
      await load();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    }
  };

  const name =
    item?.workerDisplayName ??
    `${item?.profileSnapshot?.firstName ?? ''} ${item?.profileSnapshot?.lastName ?? ''}`.trim();
  const status = item?.status;

  return (
    <ModulePage
      title={name || jobTitle || t('employer:applicants.detailTitle')}
      testID="m.employer.applicants.detail"
      scroll
    >
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {!item && !error ? (
        <View className="mt-4">
          <SkeletonList rows={2} />
        </View>
      ) : null}
      {item ? (
        <View className="mt-4">
          <JobCard
            status={item.status}
            title={name || t('employer:applicants.detailTitle')}
          >
            <Text className="font-sans text-xs text-text-low">
              {formatIstanbul(item.createdAt, timeZone)}
            </Text>
            {item.jobStartsAt && item.jobEndsAt ? (
              <JobFacts
                branchName={item.branchName}
                startsAt={item.jobStartsAt}
                endsAt={item.jobEndsAt}
                payAmountMinor={item.payAmountMinor}
                payCurrency={item.payCurrency}
                amenities={item.amenities}
              />
            ) : (
              <>
                {item.jobTitle || jobTitle ? (
                  <Text className="font-sans text-sm text-text-high">
                    {item.jobTitle ?? jobTitle}
                  </Text>
                ) : null}
                {item.branchName ? (
                  <Text className="font-sans mt-1 text-sm text-text-medium">
                    {item.branchName}
                  </Text>
                ) : null}
              </>
            )}
            <View className="mt-3">
              <ApplicantFacts snapshot={item.profileSnapshot} sectors={sectors} />
            </View>
          </JobCard>
        </View>
      ) : null}
      <View className="mt-6 gap-3">
        {status === 'pending' || status === 'substitute' ? (
          <Button
            label={t('employer:applicants.accept')}
            onPress={() =>
              void run((token) =>
                acceptApplication(item!.id, token, `accept-${item!.id}`),
              )
            }
          />
        ) : null}
        {status === 'pending' || status === 'substitute' ? (
          <Button
            label={t('employer:applicants.reject')}
            variant="destructive"
            onPress={() => void run((token) => rejectApplication(item!.id, token))}
          />
        ) : null}
        {status === 'pending' ? (
          <Button
            label={t('employer:applicants.substitute')}
            variant="secondary"
            onPress={() =>
              void run((token) => moveApplicationToSubstitute(item!.id, token))
            }
          />
        ) : null}
        {status === 'substitute' ? (
          <Button
            label={t('employer:applicants.removeSubstitute')}
            variant="secondary"
            onPress={() =>
              void run((token) => removeApplicationSubstitute(item!.id, token))
            }
          />
        ) : null}
        {status === 'accepted' ? (
          <Button
            label={t('employer:applicants.revoke')}
            variant="destructive"
            onPress={() =>
              void run((token) =>
                revokeAcceptApplication(item!.id, token, `revoke-${item!.id}`),
              )
            }
          />
        ) : null}
        {item ? (
          <Button
            label={t('employer:applicants.favorite')}
            variant="secondary"
            onPress={() =>
              void run((token) =>
                createFavorite(
                  token,
                  { type: 'worker', id: item.workerUserId },
                  `fav-worker-${item.workerUserId}`,
                ),
              )
            }
          />
        ) : null}
        {item ? (
          <Button
            label={t('employer:applicants.process')}
            variant="ghost"
            onPress={() =>
              navigation.navigate('SharedJobProcess', {
                applicationId: item.id,
              })
            }
          />
        ) : null}
      </View>
    </ModulePage>
  );
}
