import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WorkerStackParamList } from '../../../app/navigation/worker-types';
import { ApiClientError } from '../../../api/client';
import { checkOutFromShift, fetchShift } from '../../../api/shifts-api';
import { JobCard } from '../../../components/job/JobCard';
import { ShiftFacts } from '../../../components/job/ShiftFacts';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatStrip } from '../../../components/ui/StatStrip';
import { ClayChip } from '../../../components/ui/ClayChip';
import { TextField } from '../../../components/ui/TextField';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { durationHours, elapsedLabel } from '../../../shared/datetime/countdown';
import { formatPayTry } from '../../../shared/format/pay';
import { formatIstanbul, useDisplayTimeZone } from '../../../shared/datetime/istanbul';

type Props = NativeStackScreenProps<
  WorkerStackParamList,
  'WorkerShiftCheckOut'
>;

export function WorkerShiftCheckOutScreen({ route, navigation }: Props) {
  const { shiftId } = route.params ?? { shiftId: '' };
  const { t } = useTranslation(['worker', 'common', 'errors']);
  const timeZone = useDisplayTimeZone();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState<string | null>(null);
  const [shift, setShift] = useState<Awaited<
    ReturnType<typeof fetchShift>
  > | null>(null);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const token = getAccessToken();
      if (!token) {
        return;
      }
      const data = await fetchShift(shiftId, token);
      setShift(data);
      setTitle(data.jobTitle ?? data.branchName ?? null);
      setStartsAt(data.startsAt);
      setEndsAt(data.endsAt);
      setCheckedInAt(data.checkedInAt ?? null);
    })();
  }, [shiftId]);

  const onCheckOut = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await checkOutFromShift(
        shiftId,
        token,
        { notes: notes.trim() || undefined },
        `checkout-${shiftId}`,
      );
      navigation.navigate('SharedRatingsPending');
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

  const hours = startsAt && endsAt ? durationHours(startsAt, endsAt) : null;
  const elapsed = checkedInAt ? elapsedLabel(checkedInAt) : null;
  const pay = shift
    ? formatPayTry(shift.payAmountMinor, shift.payCurrency)
    : null;
  const recap = [
    ...(hours != null
      ? [{ label: t('worker:revenue.statHours'), value: String(hours) }]
      : []),
    ...(elapsed
      ? [{ label: t('worker:shift.statElapsed'), value: elapsed }]
      : []),
    ...(pay ? [{ label: t('worker:revenue.statPay'), value: pay }] : []),
  ];

  return (
    <ModulePage title={t('worker:shift.checkOutTitle')} testID="m.worker.shift.check-out" scroll>
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('worker:shift.checkOutLead')}
      </Text>
      {!shift ? (
        <View className="mt-4">
          <SkeletonList rows={2} />
        </View>
      ) : null}
      {recap.length ? (
        <View className="mt-3">
          <StatStrip items={recap} />
        </View>
      ) : null}
      {shift ? (
        <View className="mt-3">
          <JobCard title={title ?? t('worker:jobs.untitled')} status={shift.status}>
            <ShiftFacts shift={shift} />
            {startsAt && endsAt ? (
              <Text className="font-sans mt-1 text-sm text-text-medium">
                {formatIstanbul(startsAt, timeZone)} – {formatIstanbul(endsAt, timeZone)}
              </Text>
            ) : null}
          </JobCard>
        </View>
      ) : null}
      <View className="mt-4 flex-row flex-wrap gap-2">
        {(
          [
            ['checkOutChipOk', t('worker:shift.checkOutChipOk')],
            ['checkOutChipOvertime', t('worker:shift.checkOutChipOvertime')],
            ['checkOutChipLate', t('worker:shift.checkOutChipLate')],
          ] as const
        ).map(([key, label]) => (
          <ClayChip
            key={key}
            label={label}
            selected={notes === label}
            onPress={() => setNotes(label)}
          />
        ))}
      </View>
      <View className="mt-3">
        <TextField
          label={t('worker:shift.checkOutNotes')}
          multiline
          numberOfLines={4}
          onChangeText={setNotes}
          value={notes}
        />
      </View>
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Button
        className="mt-8"
        disabled={submitting}
        label={submitting ? t('common:loading') : t('worker:shift.checkOutConfirm')}
        onPress={() => void onCheckOut()}
        testID="CheckOutButton"
      />
    </ModulePage>
  );
}
