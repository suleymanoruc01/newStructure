import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmployerStackParamList } from '../../../app/navigation/employer-types';
import { fetchEmployerMe, patchEmployerMe } from '../../../api/employers-api';
import { fetchJobCatalog } from '../../../api/jobs-api';
import { ApiClientError } from '../../../api/client';
import { formErrorMessage } from '../../../api/form-error';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pressable } from '../../../components/ui/Pressable';
import { StatStrip } from '../../../components/ui/StatStrip';
import { TextField } from '../../../components/ui/TextField';
import { ModulePage } from '../../../components/ui/ScreenModules';
import { getAccessToken } from '../../../shared/auth/session-memory';

type Props = NativeStackScreenProps<EmployerStackParamList, 'EmployerIndustry'>;

export function EmployerIndustryScreen({ navigation }: Props) {
  const { t } = useTranslation(['employer', 'common', 'errors']);
  const [codes, setCodes] = useState<string[]>([]);
  const [sectors, setSectors] = useState<
    Awaited<ReturnType<typeof fetchJobCatalog>>['sectors']
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const token = getAccessToken();
        if (!token) {
          return;
        }
        const [employer, catalog] = await Promise.all([
          fetchEmployerMe(token),
          fetchJobCatalog(),
        ]);
        setCodes(employer.industryCodes);
        setSectors(catalog.sectors);
      } catch (err) {
        setError(formErrorMessage(err, t));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const needle = query.trim().toLocaleLowerCase('tr-TR');
  const shownSectors = needle
    ? sectors.filter(
        (sector) =>
          sector.displayName.toLocaleLowerCase('tr-TR').includes(needle) ||
          sector.code.toLocaleLowerCase('tr-TR').includes(needle),
      )
    : sectors;

  const onSave = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new ApiClientError('Oturum bulunamadı.', 401, 'UNAUTHORIZED');
      }
      await patchEmployerMe({ industryCodes: codes }, token);
      navigation.goBack();
    } catch (err) {
      setError(formErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModulePage
      title={t('employer:industry.title')}
      testID="m.employer.industry.manage"
      scroll
    >
      {error ? (
        <Text className="font-sans mt-2 text-sm text-feedback-error">{error}</Text>
      ) : null}
      <View className="mt-3">
        <StatStrip
          items={[
            {
              label: t('employer:industry.selected'),
              value: String(codes.length),
            },
          ]}
        />
      </View>
      {!loading && sectors.length === 0 && !error ? (
        <View className="mt-4">
          <EmptyState title={t('employer:industry.title')} />
        </View>
      ) : null}
      {sectors.length > 0 ? (
        <View className="mt-3">
          <TextField
            inset
            shape="capsule"
            label={t('employer:industry.search')}
            onChangeText={setQuery}
            value={query}
          />
        </View>
      ) : null}
      <View className="mt-4 flex-row flex-wrap gap-2">
        {shownSectors.map((sector) => {
          const on = codes.includes(sector.code);
          return (
            <Pressable
              key={sector.code}
              className={`rounded-full px-3 py-2 ${
                on ? 'bg-action-primary' : 'bg-surface-1'
              }`}
              onPress={() =>
                setCodes((current) =>
                  current.includes(sector.code)
                    ? current.filter((code) => code !== sector.code)
                    : [...current, sector.code],
                )
              }
            >
              <Text
                className={`font-sans text-sm ${
                  on ? 'text-text-on' : 'text-text-high'
                }`}
              >
                {sector.displayName}
              </Text>
            </Pressable>
          );
        })}
        {!loading && sectors.length > 0 && shownSectors.length === 0 ? (
          <EmptyState title={t('employer:industry.searchEmpty')} />
        ) : null}
      </View>
      <View className="mt-6">
        <Button
          disabled={submitting}
          label={t('common:continue')}
          onPress={() => void onSave()}
        />
      </View>
    </ModulePage>
  );
}
