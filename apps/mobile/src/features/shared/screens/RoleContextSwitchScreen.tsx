import type { AuthContext } from '@parton/api-contracts';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from '../../../components/ui/Pressable';
import { useTranslation } from 'react-i18next';

import { ApiClientError } from '../../../api/client';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { getActiveContext } from '../../../shared/auth/session-memory';

function contextLabel(ctx: AuthContext, t: (key: string) => string): string {
  if (ctx.role === 'worker') {
    return t('auth:contextSwitch.roleWorker');
  }
  if (ctx.role === 'employer') {
    return t('auth:contextSwitch.roleEmployer');
  }
  if (ctx.role === 'manager') {
    return t('auth:contextSwitch.roleManager');
  }
  return t('auth:contextSwitch.roleAdmin');
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
      <View className="mt-6 gap-2">
        {contexts.map((ctx, index) => {
          const isActive =
            active?.role === ctx.role &&
            active.employerId === ctx.employerId &&
            JSON.stringify(active.branchIds ?? []) ===
              JSON.stringify(ctx.branchIds ?? []);
          return (
            <Pressable
              key={`${ctx.role}-${ctx.employerId ?? 'none'}-${index}`}
              accessibilityRole="button"
              className={`rounded-xl px-4 py-3 ${
                isActive ? 'bg-accent-mustard' : 'bg-surface-1'
              }`}
              disabled={submitting || isActive}
              onPress={() => void onSelect(ctx)}
              testID="MembershipListItem"
            >
              <Text className="font-sans font-semibold text-text-high">
                {contextLabel(ctx, t)}
              </Text>
              {ctx.employerId ? (
                <Text
                  className="font-sans mt-1 text-xs text-text-medium"
                >
                  {ctx.employerId}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text className="font-sans mt-4 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <Pressable className="mt-8" onPress={onClose}>
        <Text className="font-sans text-center text-base text-text-medium">
          {t('common:back')}
        </Text>
      </Pressable>
    </ModulePage>
  );
}
