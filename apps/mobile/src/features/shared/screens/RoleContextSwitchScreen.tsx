import type { AuthContext } from '@parton/api-contracts';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { JobCard } from '../../../components/job/JobCard';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { StatStrip } from '../../../components/ui/StatStrip';
import { useTranslation } from 'react-i18next';

import { ApiClientError } from '../../../api/client';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { getActiveContext } from '../../../shared/auth/session-memory';

function contextLabel(ctx: AuthContext, t: (key: string) => string): string {
  const role =
    ctx.role === 'worker'
      ? t('auth:contextSwitch.roleWorker')
      : ctx.role === 'employer'
        ? t('auth:contextSwitch.roleEmployer')
        : ctx.role === 'manager'
          ? t('auth:contextSwitch.roleManager')
          : t('auth:contextSwitch.roleAdmin');
  return ctx.label ? `${role} · ${ctx.label}` : role;
}

type Props = {
  onClose: () => void;
};

export function RoleContextSwitchScreen({ onClose }: Props) {
  const { contexts, switchActiveContext } = useAuth();
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const active = getActiveContext();

  const onSelect = async (ctx: AuthContext) => {
    setSubmitting(true);
    setError(null);
    try {
      await switchActiveContext(ctx);
      onClose();
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
    <ModulePage title={t('auth:contextSwitch.title')} testID="m.shared.auth.context-switch" scroll>
      
      <Text className="font-sans mt-2 text-sm text-text-medium">
        {t('auth:contextSwitch.lead')}
      </Text>
      <View className="mt-3">
        <StatStrip
          items={[
            {
              label: t('auth:contextSwitch.title'),
              value: String(contexts.length),
            },
          ]}
        />
      </View>
      <View className="mt-6 gap-2">
        {contexts.map((ctx, index) => {
          const isActive =
            active?.role === ctx.role &&
            active.employerId === ctx.employerId &&
            JSON.stringify(active.branchIds ?? []) ===
              JSON.stringify(ctx.branchIds ?? []);
          return (
            <View
              key={`${ctx.role}-${ctx.employerId ?? 'none'}-${index}`}
              testID="MembershipListItem"
            >
              <JobCard
                title={contextLabel(ctx, t)}
                onPress={
                  submitting || isActive ? undefined : () => void onSelect(ctx)
                }
              >
                {isActive ? (
                  <StatusBadge
                    label={t('auth:contextSwitch.active')}
                    tone="strong"
                  />
                ) : null}
              </JobCard>
            </View>
          );
        })}
      </View>
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Button
        className="mt-8"
        label={t('common:back')}
        onPress={onClose}
        variant="ghost"
      />
    </ModulePage>
  );
}
