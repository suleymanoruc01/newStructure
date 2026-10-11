import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { Button } from '../../../components/ui/Button';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { listPublishedPolicies } from '../../../api/auth-api';
import { ApiClientError } from '../../../api/client';
import { useAuth } from '../../../shared/auth/AuthProvider';
import { SCREEN_IDS } from '../screen-ids';

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthPolicies'>;

type PolicyRow = {
  id: string;
  title: string;
  body: string;
  version: string;
  required: boolean;
};

const TEXT_VIEW_HEIGHT = 420;

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

function requiredReadMs(body: string): number {
  return Math.min(20_000, Math.max(4_000, body.length * 25));
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
  const [scrolled, setScrolled] = useState(false);
  const [waited, setWaited] = useState(false);
  const [readConfirmed, setReadConfirmed] = useState(false);
  const [readRatio, setReadRatio] = useState(0);
  const viewHeight = useRef(0);
  const contentHeight = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = browsing
        ? (await listPublishedPolicies()).items
        : await loadPendingPolicies();
      setPolicies(items);
      setBrowseIndex(0);
      setTotal(items.length);
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

  const current = browsing ? policies[browseIndex] : policies[0];
  const policyKey = current ? `${current.id}:${current.version}` : '';
  const position = browsing
    ? browseIndex + 1
    : current
      ? Math.max(total - policies.length + 1, 1)
      : 0;
  const readyToAct = scrolled && waited && (browsing || readConfirmed);

  const noteReachedEnd = useCallback(() => {
    setScrolled(true);
  }, []);

  const considerFit = useCallback(() => {
    if (
      viewHeight.current > 0 &&
      contentHeight.current > 0 &&
      contentHeight.current <= viewHeight.current + 8
    ) {
      noteReachedEnd();
      setReadRatio(1);
    }
  }, [noteReachedEnd]);

  useEffect(() => {
    setScrolled(false);
    setWaited(false);
    setReadConfirmed(false);
    setReadRatio(0);
    viewHeight.current = 0;
    contentHeight.current = 0;
    if (!current) {
      return;
    }
    const timer = setTimeout(() => setWaited(true), requiredReadMs(current.body));
    return () => clearTimeout(timer);
  }, [policyKey, current]);

  useEffect(() => {
    if (!current || browsing || !scrolled || !waited || readConfirmed) {
      return;
    }
    let cancelled = false;
    void recordPolicyRead(current.id, current.version)
      .then(() => {
        if (!cancelled) {
          setReadConfirmed(true);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiClientError) {
          setError(t(`errors:${err.code}`, { defaultValue: err.message }));
        } else {
          setError(t('common:networkError'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [browsing, current, readConfirmed, recordPolicyRead, scrolled, t, waited]);

  const onAccept = async () => {
    if (!current || !readyToAct) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const rest = await acknowledgePolicy(current.id, current.version);
      setPolicies(rest);
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

  return (
    <ModulePage
      eyebrow="PartOn"
      hero={
        <Text className="mt-3 font-sans text-base leading-6 text-text-on">
          {t('auth:policies.subtitle')}
        </Text>
      }
      scroll
      testID={SCREEN_IDS.policies}
      title={t('auth:policies.title')}
    >
      {loading ? (
        <Text className="font-sans text-text-medium">{t('common:loading')}</Text>
      ) : current ? (
        <View className="rounded-[28px] bg-surface-1 p-5">
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
          <View className="mt-3 self-start rounded-full bg-surface-base px-3 py-1">
            <Text className="font-sans text-sm text-text-medium">
              {t('auth:policies.version', { version: current.version })}
            </Text>
          </View>
          <View className="mt-4 h-1 overflow-hidden rounded-full bg-surface-2">
            <View
              className="h-1 rounded-full bg-action-primary"
              style={{ width: `${Math.round(readRatio * 100)}%` }}
            />
          </View>
          <ScrollView
            nestedScrollEnabled
            style={{ height: TEXT_VIEW_HEIGHT, marginTop: 16 }}
            onLayout={(event) => {
              viewHeight.current = event.nativeEvent.layout.height;
              considerFit();
            }}
            onContentSizeChange={(_width, height) => {
              contentHeight.current = height;
              considerFit();
            }}
            onScroll={(event) => {
              const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
              const ratio =
                contentSize.height <= layoutMeasurement.height
                  ? 1
                  : (contentOffset.y + layoutMeasurement.height) / contentSize.height;
              setReadRatio(Math.min(1, Math.max(0, ratio)));
              if (
                layoutMeasurement.height + contentOffset.y >=
                contentSize.height - 24
              ) {
                noteReachedEnd();
              }
            }}
            scrollEventThrottle={16}
          >
            <View className="gap-4 pb-2">
              {readingBlocks(current.body).map((block, index) => (
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
          </ScrollView>
        </View>
      ) : (
        <Text className="font-sans text-text-medium">{t('auth:policies.empty')}</Text>
      )}
      {current && !readyToAct ? (
        <Text className="font-sans text-sm text-text-low">
          {scrolled ? t('auth:policies.keepReading') : t('auth:policies.scrollToEnd')}
        </Text>
      ) : null}
      {error ? <Text className="font-sans text-sm text-feedback-error">{error}</Text> : null}
      {browsing ? (
        <Button
          disabled={loading || !current || !readyToAct}
          label={
            current && browseIndex < policies.length - 1
              ? t('auth:policies.next')
              : t('common:back')
          }
          onPress={() => {
            if (!readyToAct) {
              return;
            }
            if (browseIndex < policies.length - 1) {
              setBrowseIndex((value) => value + 1);
              return;
            }
            navigation.goBack();
          }}
          shape="capsule"
        />
      ) : (
        <Button
          disabled={submitting || loading || !current || !readyToAct}
          label={current ? t('auth:policies.acceptOne') : t('common:continue')}
          onPress={() => void onAccept()}
          shape="capsule"
        />
      )}
    </ModulePage>
  );
}
