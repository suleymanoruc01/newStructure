import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui/Button';
import { SkeletonList } from '../../../components/ui/SkeletonList';
import { clayCard, clayChip } from '../../../components/ui/clay';
import { Pressable } from '../../../components/ui/Pressable';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { listPublishedPolicies } from '../../../api/auth-api';
import { ApiClientError } from '../../../api/client';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { SCREEN_IDS } from '../screen-ids';
import { markIfFits, measured, type TextMeasure } from './policy-text';

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthPolicies'>;

type PolicyRow = {
  id: string;
  title: string;
  body: string;
  version: string;
  required: boolean;
};

function readingBlocks(body: string): string[] {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => part.length > 0);
  if (paragraphs.length > 1) {
    return paragraphs;
  }
  const text = paragraphs[0] ?? '';
  return text.split(/(?<=\.)\s+(?=\p{Lu})/u).filter((part) => part.length > 0);
}

export function AuthPoliciesScreen({ navigation }: Props) {
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const {
    loadPendingPolicies,
    recordPolicyRead,
    acknowledgePolicy,
    continueAfterPolicies,
    phase,
  } = useAuth();
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [total, setTotal] = useState(0);
  const [browseIndex, setBrowseIndex] = useState(0);
  const browsing = phase === 'unauthenticated';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tick, setTick] = useState({ key: '', on: false });
  const [readRatio, setReadRatio] = useState(0);
  const [textMeasure, setTextMeasure] = useState<TextMeasure | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = browsing
        ? ((await listPublishedPolicies()).items ?? [])
        : await loadPendingPolicies();
      setPolicies(items ?? []);
      setBrowseIndex(0);
      setTotal((items ?? []).length);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setLoading(false);
    }
  }, [browsing, loadPendingPolicies, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const reportError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    },
    [t],
  );

  const leaveWhenClear = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const next = await continueAfterPolicies(true);
      if (next !== 'needs_policies') {
        return;
      }
      const again = await loadPendingPolicies();
      if (again.length > 0) {
        setPolicies(again);
        setTotal((count) => Math.max(count, again.length));
        return;
      }
      setError(t('common:networkError'));
    } catch (err) {
      reportError(err);
    } finally {
      setSubmitting(false);
    }
  }, [continueAfterPolicies, loadPendingPolicies, reportError, t]);

  const startedLeave = useRef(false);
  useEffect(() => {
    if (loading || policies.length > 0) {
      return;
    }
    if (browsing) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
      return;
    }
    if (startedLeave.current) {
      return;
    }
    startedLeave.current = true;
    void leaveWhenClear();
  }, [browsing, leaveWhenClear, loading, navigation, policies.length]);

  const current = browsing ? policies[browseIndex] : policies[0];
  const policyKey = current ? `${current.id}:${current.version}` : '';
  const position = browsing
    ? browseIndex + 1
    : current
      ? Math.max(total - policies.length + 1, 1)
      : 0;
  const measure = measured(policyKey, textMeasure);
  const fits =
    measure.view > 0 && measure.content > 0 && measure.content <= measure.view + 8;
  const overflows = measure.content > measure.view + 8;
  const scrolled = measure.end || fits;
  const checked = tick.key === policyKey && tick.on;
  const readyToAct = checked;

  const rememberMeasure = useCallback(
    (patch: Partial<Pick<TextMeasure, 'view' | 'content' | 'end'>>) => {
      setTextMeasure((prev) =>
        markIfFits({ ...measured(policyKey, prev), ...patch }),
      );
    },
    [policyKey],
  );

  useEffect(() => {
    setReadRatio(0);
  }, [policyKey]);

  const onAccept = async () => {
    if (!current || !checked) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await recordPolicyRead(current.id, current.version);
      const rest = await acknowledgePolicy(current.id, current.version);
      if (rest.length > 0) {
        setPolicies(rest);
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'POLICY_VERSION_STALE') {
        await load();
      }
      if (err instanceof ApiClientError) {
        setError(t(`errors:${err.code}`, { defaultValue: err.message }));
      } else {
        setError(t('common:networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!browsing && !loading && !current && !error) {
    return null;
  }

  return (
    <ModulePage
      eyebrow="PartOn"
      hero={
        <Text className="mt-3 font-sans text-base leading-6 text-text-on">
          {t('auth:policies.subtitle')}
        </Text>
      }
      scroll={false}
      testID={SCREEN_IDS.policies}
      title={t('auth:policies.title')}
    >
      <View className="min-h-0 flex-1">
      {loading ? (
        <View className="mt-4">
          <SkeletonList rows={3} />
        </View>
      ) : current ? (
        <View
          style={clayCard}
          className="min-h-0 flex-1 rounded-[28px] bg-surface-1 p-5"
        >
          <View className="mb-4 flex-row gap-1.5">
            {Array.from({ length: Math.max(total, policies.length, 1) }, (_, index) => (
              <View
                key={index}
                className={`h-1.5 flex-1 rounded-full ${
                  index < position - 1
                    ? 'bg-action-primary'
                    : index === position - 1
                      ? 'bg-action-secondary'
                      : 'bg-surface-2'
                }`}
              />
            ))}
          </View>
          <Text className="font-sans text-sm text-text-low">
            {t('auth:policies.progress', {
              current: position,
              total: browsing ? policies.length : Math.max(total, position),
            })}
          </Text>
          <Text className="mt-2 font-display text-2xl font-semibold leading-8 text-text-high">
            {current.title}
          </Text>
          <View
            className="mt-3 self-start rounded-full bg-surface-1 px-3 py-2"
            style={clayChip(false)}
          >
            <Text className="font-sans text-sm text-text-medium">
              {t('auth:policies.version', { version: current.version })}
            </Text>
          </View>
          <View className="mt-4 h-1 overflow-hidden rounded-full bg-surface-2">
            <View
              className="h-1 rounded-full bg-action-primary"
              style={{ width: `${Math.round((fits ? 1 : readRatio) * 100)}%` }}
            />
          </View>
          <ScrollView
            key={policyKey}
            nestedScrollEnabled
            scrollEnabled={measure.content === 0 || overflows}
            showsVerticalScrollIndicator
            style={{ flex: 1, marginTop: 16, minHeight: 0 }}
            onLayout={(event) => {
              rememberMeasure({ view: event.nativeEvent.layout.height });
            }}
            onContentSizeChange={(_width, height) => {
              rememberMeasure({ content: height });
            }}
            onScroll={(event) => {
              const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
              const ratio =
                contentSize.height <= layoutMeasurement.height
                  ? 1
                  : (contentOffset.y + layoutMeasurement.height) / contentSize.height;
              setReadRatio(Math.min(1, Math.max(0, ratio)));
              if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 24) {
                rememberMeasure({
                  view: layoutMeasurement.height,
                  content: contentSize.height,
                  end: true,
                });
              }
            }}
            scrollEventThrottle={16}
          >
            <View className="gap-4 pb-2">
              {readingBlocks(current.body ?? '').map((block, index) => (
                <Text
                  key={`${policyKey}-${index}`}
                  className={
                    index === 0
                      ? 'font-sans text-lg leading-8 text-text-high'
                      : 'font-sans text-base leading-7 text-text-medium'
                  }
                >
                  {block}
                </Text>
              ))}
            </View>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked, disabled: !scrolled || submitting }}
              style={clayCard}
              className="mt-4 flex-row items-center gap-3 rounded-[22px] bg-surface-1 px-4 py-3"
              disabled={!scrolled || submitting}
              onPress={() => {
                if (!scrolled) {
                  return;
                }
                setTick({ key: policyKey, on: !checked });
              }}
            >
              <View
                className={`h-6 w-6 items-center justify-center rounded-md border-2 border-action-secondary ${
                  checked ? 'bg-action-secondary' : 'bg-surface-1'
                }`}
              >
                {checked ? (
                  <Text className="font-sans text-sm font-bold text-text-on">✓</Text>
                ) : null}
              </View>
              <Text className="flex-1 font-sans text-base leading-6 text-text-high">
                {t('auth:policies.confirm')}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      ) : null}
      {current && overflows && !scrolled ? (
        <Text className="mt-3 font-sans text-sm text-text-low">
          {t('auth:policies.scrollToEnd')}
        </Text>
      ) : null}
      {error ? <Text className="mt-3 font-sans text-sm text-feedback-error">{error}</Text> : null}
      {current && browsing ? (
        <Button
          disabled={loading || !readyToAct}
          label={
            current && browseIndex < policies.length - 1
              ? t('auth:policies.next')
              : t('common:back')
          }
          onPress={() => {
            if (!checked) {
              return;
            }
            if (browseIndex < policies.length - 1) {
              setBrowseIndex((value) => value + 1);
              return;
            }
            navigation.goBack();
          }}
          className="mt-4"
          shape="capsule"
        />
      ) : current ? (
        <Button
          disabled={submitting || loading || !readyToAct}
          label={t('auth:policies.acceptOne')}
          onPress={() => void onAccept()}
          className="mt-4"
          shape="capsule"
        />
      ) : null}
      </View>
    </ModulePage>
  );
}
