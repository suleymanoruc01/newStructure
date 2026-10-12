import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { statusLabelTr } from '@parton/api-contracts';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { JobCard } from '../../../components/job/JobCard';
import { JobFacts } from '../../../components/job/JobFacts';
import { LocationMap } from '../../../components/map/LocationMap';
import { Button } from '../../../components/ui/Button';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { StatusBadge, statusTone } from '../../../components/ui/StatusBadge';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { ApiClientError } from '../../../api/client';
import { listMyApplications } from '../../../api/applications-api';
import { createFavorite } from '../../../api/favorites-api';
import { fetchJobDetail } from '../../../api/jobs-api';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { formatPayTry } from '../../../shared/format/pay';
import { loadGeofenceRadii } from '../../../shared/location/geofence-config';
import { type GeofenceRadii } from '../../../shared/location/geofence';
import { openMapsAt } from '../../../shared/maps/open-maps';
import { shareViaWhatsApp } from '../../../shared/share/whatsapp';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerJobDetail'>;

export function WorkerJobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [radii, setRadii] = useState<GeofenceRadii | null>(null);
  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof fetchJobDetail>
  > | null>(null);
  const [myApplicationId, setMyApplicationId] = useState<string | null>(null);
  const [myApplicationStatus, setMyApplicationStatus] = useState<string | null>(
    null,
  );
  const [myApplicationKnown, setMyApplicationKnown] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMyApplicationKnown(false);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await fetchJobDetail(jobId, token);
      setDetail(data);
      // shortcut: full my-applications list to match jobId; add GET /jobs/:id/my-application when lists grow
      const mine = await listMyApplications(token);
      const mineRow = mine.items.find((row) => row.jobId === jobId);
      setMyApplicationId(mineRow?.id ?? null);
      setMyApplicationStatus(mineRow?.status ?? null);
      setMyApplicationKnown(true);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setLoading(false);
    }
  }, [jobId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadGeofenceRadii().then(setRadii);
  }, []);

  return (
    <ModulePage
      title={detail?.title ?? detail?.branchName ?? t('worker:jobs.untitled')}
      testID="m.worker.jobs.detail"
      refreshing={loading}
      scroll
      onRefresh={() => void load()}
    >
      {loading && !detail ? <SkeletonList rows={2} /> : null}
      {detail ? (
        <View>
          {detail.remainingHeadcount != null ||
          detail.distanceKm != null ||
          detail.payAmountMinor != null ? (
            <View className="mb-3">
              <StatStrip
                items={[
                  ...(formatPayTry(
                    detail.payAmountMinor,
                    detail.payCurrency,
                  )
                    ? [
                        {
                          label: t('worker:jobs.pay'),
                          value: formatPayTry(
                            detail.payAmountMinor,
                            detail.payCurrency,
                          )!,
                        },
                      ]
                    : []),
                  ...(detail.remainingHeadcount != null &&
                  detail.headcount != null
                    ? [
                        {
                          label: t('worker:jobs.seats', {
                            remaining: detail.remainingHeadcount,
                            total: detail.headcount,
                          }),
                          value: String(detail.remainingHeadcount),
                        },
                      ]
                    : []),
                  ...(detail.distanceKm != null
                    ? [
                        {
                          label: t('worker:jobs.distance', {
                            km: detail.distanceKm.toFixed(1),
                          }),
                          value: `${detail.distanceKm.toFixed(1)}`,
                        },
                      ]
                    : []),
                ]}
              />
            </View>
          ) : null}
          {detail.eligibility ? (
            <View className="mb-3">
              <StatusBadge
                label={
                  detail.eligibility.eligible
                    ? t('worker:jobs.eligible')
                    : t('worker:jobs.notEligible')
                }
                tone={detail.eligibility.eligible ? 'strong' : 'error'}
              />
              {!detail.eligibility.eligible ? (
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {detail.eligibility.reasons.map((reason) => (
                    <StatusBadge key={reason} label={reason} />
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
          <JobCard
            title={
              detail.title ?? detail.branchName ?? t('worker:jobs.untitled')
            }
          >
            <JobFacts
              branchName={detail.branchName}
              startsAt={detail.startsAt}
              endsAt={detail.endsAt}
              payAmountMinor={detail.payAmountMinor}
              payCurrency={detail.payCurrency}
              distanceKm={detail.distanceKm}
              headcount={detail.headcount}
              remainingHeadcount={detail.remainingHeadcount}
              favoritesOnly={detail.favoritesOnly}
              instantAutoApprove={detail.instantAutoApprove}
              matchReasons={detail.matchReasons}
              requiredDocumentTypes={detail.requiredDocumentTypes}
              amenities={detail.amenities}
              notes={detail.notes}
            />
          </JobCard>
          {myApplicationId ? (
            <View className="mt-6 gap-2">
              {myApplicationStatus ? (
                <StatusBadge
                  label={statusLabelTr(myApplicationStatus)}
                  tone={statusTone(myApplicationStatus)}
                />
              ) : null}
              <Button
                label={t('worker:applications.process')}
                onPress={() =>
                  navigation.navigate('SharedJobProcess', {
                    applicationId: myApplicationId,
                  })
                }
              />
            </View>
          ) : myApplicationKnown && detail.eligibility?.eligible ? (
            <View className="mt-6">
              <Button
                label={t('worker:jobs.apply')}
                onPress={() =>
                  navigation.navigate('WorkerJobApply', { jobId })
                }
              />
            </View>
          ) : null}
          {detail.branchLatitude != null && detail.branchLongitude != null ? (
            <View className="mt-4">
              <LocationMap
                pin={{
                  latitude: detail.branchLatitude,
                  longitude: detail.branchLongitude,
                }}
                pinLabel={detail.branchName}
                radiusM={radii?.radiusM}
                softRadiusM={radii?.softRadiusM}
              />
            </View>
          ) : null}
          <View className="mt-4 gap-3">
            {detail.branchLatitude != null && detail.branchLongitude != null ? (
              <Button
                label={t('worker:jobs.openMap')}
                variant="secondary"
                onPress={() =>
                  void openMapsAt(
                    detail.branchLatitude!,
                    detail.branchLongitude!,
                    detail.branchName,
                  )
                }
              />
            ) : null}
            <Button
              label={favorited ? t('worker:jobs.favorited') : t('worker:jobs.favorite')}
              variant="secondary"
              onPress={() => {
                void (async () => {
                  try {
                    const token = getAccessToken();
                    if (!token) {
                      throw new ApiClientError(
                        'Oturum bulunamadı.',
                        401,
                        'UNAUTHORIZED',
                      );
                    }
                    await createFavorite(
                      token,
                      { type: 'employer', id: detail.employerId },
                      `fav-employer-${detail.employerId}`,
                    );
                    setFavorited(true);
                  } catch (err) {
                    if (err instanceof ApiClientError) {
                      setError(
                        t(`errors:${err.code}`, { defaultValue: err.message }),
                      );
                    } else {
                      setError(t('common:networkError'));
                    }
                  }
                })();
              }}
            />
            <Button
              label={t('worker:jobs.shareWhatsApp')}
              variant="ghost"
              onPress={() =>
                void shareViaWhatsApp(
                  `${detail.title ?? detail.branchName ?? ''} ${detail.startsAt}`,
                )
              }
            />
          </View>
        </View>
      ) : null}
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
    </ModulePage>
  );
}
