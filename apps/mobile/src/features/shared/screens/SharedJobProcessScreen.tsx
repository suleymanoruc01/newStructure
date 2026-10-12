import { statusLabelTr, type Shift, type ShiftStatus } from '@parton/api-contracts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { workerShiftRoute } from '../../../app/navigation/dock-routes';
import { getApplication } from '../../../api/applications-api';
import { ApiClientError } from '../../../api/client';
import { fetchJobCatalog } from '../../../api/jobs-api';
import { listMyShifts } from '../../../api/shifts-api';
import { ApplicantFacts } from '../../../components/application/ApplicantFacts';
import { JobCard } from '../../../components/job/JobCard';
import { JobFacts } from '../../../components/job/JobFacts';
import { ShiftFacts } from '../../../components/job/ShiftFacts';
import { Button } from '../../../components/ui/Button';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { StatusBadge, statusTone } from '../../../components/ui/StatusBadge';
import { WizardSteps } from '../../../components/ui/WizardSteps';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { processDoneCount } from '../../../shared/process/process-step';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { getAccessToken } from '../../../shared/auth/session-memory';
import { formatIstanbul, useDisplayTimeZone } from '../../../shared/datetime/istanbul';

type ProcessRoute = {
  SharedJobProcess: { applicationId: string };
  WorkerJobDetail: { jobId: string };
  EmployerJobDetail: { jobId: string };
  EmployerApplicants: { jobId: string; jobTitle?: string | null };
  WorkerShiftAvailability: { shiftId: string };
  WorkerShiftPrep: { shiftId: string };
  WorkerShiftCheckIn: { shiftId: string };
  WorkerShiftInShift: { shiftId: string };
};

type Props = NativeStackScreenProps<ProcessRoute, 'SharedJobProcess'>;

export function SharedJobProcessScreen({ route, navigation }: Props) {
  const { applicationId } = route.params ?? { applicationId: '' };
  const { t } = useTranslation(['system', 'common', 'errors']);
  const { contexts } = useAuth();
  const timeZone = useDisplayTimeZone();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [shiftStatus, setShiftStatus] = useState<ShiftStatus | null>(null);
  const [shift, setShift] = useState<Shift | null>(null);
  const [application, setApplication] = useState<Awaited<
    ReturnType<typeof getApplication>
  > | null>(null);
  const [sectors, setSectors] = useState<
    Awaited<ReturnType<typeof fetchJobCatalog>>['sectors']
  >([]);
  const isWorker = contexts.some((ctx) => ctx.role === 'worker');
  const isEmployer = contexts.some(
    (ctx) => ctx.role === 'employer' || ctx.role === 'manager',
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      const data = await getApplication(applicationId, token);
      setApplication(data);
      setTitle(data.jobTitle ?? null);
      setStatus(data.status);
      setCreatedAt(data.createdAt);
      setJobId(data.jobId);
      const catalog = await fetchJobCatalog();
      setSectors(catalog.sectors ?? []);
      if (isWorker) {
        const shifts = await listMyShifts(token);
        const shift = (shifts.items ?? []).find(
          (item) => item.applicationId === applicationId,
        );
        setShiftStatus(shift?.status ?? null);
        setShiftId(shift?.id ?? null);
        setShift(shift ?? null);
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    }
  }, [applicationId, isWorker, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const shiftDestination =
    shiftStatus != null ? workerShiftRoute(shiftStatus) : null;

  const steps = [
    { key: 'applied', done: true },
    {
      key: 'review',
      done: status != null && status !== 'pending',
    },
    {
      key: 'decision',
      done:
        status === 'accepted' ||
        status === 'rejected' ||
        status === 'withdrawn' ||
        status === 'substitute' ||
        status === 'accept_revoked',
    },
    { key: 'shift', done: shiftStatus != null },
  ];

  return (
    <ModulePage
      title={title ?? t('system:process.title')}
      testID="m.shared.job-process.detail"
      scroll
    >
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      {!application && !error ? (
        <View className="mt-4">
          <SkeletonList rows={3} />
        </View>
      ) : null}
      {application ? (
        <WizardSteps
          step={processDoneCount(status, shiftStatus != null)}
          total={4}
        />
      ) : null}
      {createdAt ? (
        <Text className="font-sans mt-1 text-xs text-text-low">
          {formatIstanbul(createdAt, timeZone)}
        </Text>
      ) : null}
      {application?.jobStartsAt && application.jobEndsAt ? (
        <View className="mt-3">
          <JobCard
            status={status}
            title={title ?? t('system:process.title')}
          >
            <JobFacts
              branchName={application.branchName}
              startsAt={application.jobStartsAt}
              endsAt={application.jobEndsAt}
              payAmountMinor={application.payAmountMinor}
              payCurrency={application.payCurrency}
              amenities={application.amenities}
            />
            {application && isEmployer ? (
              <View className="mt-2">
                <ApplicantFacts
                  snapshot={application.profileSnapshot}
                  sectors={sectors}
                />
              </View>
            ) : null}
          </JobCard>
        </View>
      ) : null}
      <View className="mt-6 gap-3">
        {steps.map((step) => (
          <JobCard
            key={step.key}
            title={t(`system:process.steps.${step.key}`)}
          >
            <StatusBadge
              label={
                step.done
                  ? t('system:process.done')
                  : t('system:process.waiting')
              }
              tone={step.done ? 'strong' : 'warn'}
            />
            {step.key === 'applied' && createdAt ? (
              <Text className="font-sans mt-2 text-xs text-text-low">
                {formatIstanbul(createdAt, timeZone)}
              </Text>
            ) : null}
            {step.key === 'decision' &&
            application?.updatedAt &&
            status != null &&
            status !== 'pending' ? (
              <Text className="font-sans mt-2 text-xs text-text-low">
                {formatIstanbul(application.updatedAt, timeZone)}
              </Text>
            ) : null}
            {step.key === 'shift' && shiftStatus ? (
              <View className="mt-2">
                <StatusBadge
                  label={statusLabelTr(shiftStatus)}
                  tone={statusTone(shiftStatus)}
                />
                {shift ? (
                  <View className="mt-2">
                    <ShiftFacts shift={shift} />
                  </View>
                ) : null}
              </View>
            ) : null}
          </JobCard>
        ))}
      </View>
      <View className="mt-6 gap-3">
        {isWorker &&
        shiftId &&
        (shiftDestination === 'WorkerShiftAvailability' ||
          shiftDestination === 'WorkerShiftPrep' ||
          shiftDestination === 'WorkerShiftCheckIn' ||
          shiftDestination === 'WorkerShiftInShift') ? (
          <Button
            label={t('system:process.openShift')}
            onPress={() =>
              navigation.navigate(shiftDestination, { shiftId })
            }
          />
        ) : null}
        {isWorker && jobId ? (
          <Button
            label={t('system:process.openJob')}
            variant="secondary"
            onPress={() => navigation.navigate('WorkerJobDetail', { jobId })}
          />
        ) : null}
        {isEmployer && jobId ? (
          <Button
            label={t('system:process.openJob')}
            variant="secondary"
            onPress={() => navigation.navigate('EmployerJobDetail', { jobId })}
          />
        ) : null}
        {isEmployer && jobId ? (
          <Button
            label={t('system:process.openApplicants')}
            onPress={() =>
              navigation.navigate('EmployerApplicants', {
                jobId,
                jobTitle: title,
              })
            }
          />
        ) : null}
      </View>
    </ModulePage>
  );
}
