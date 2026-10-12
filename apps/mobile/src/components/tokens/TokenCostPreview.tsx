import React from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ClayCard } from '../ui/ClayCard';

export function TokenCostPreview({
  need,
  available,
}: {
  need: number;
  available: number | null;
}) {
  const { t } = useTranslation('employer');
  return (
    <ClayCard>
      <Text className="font-display text-xl font-semibold text-text-high">
        {t('employer:jobs.tokenCost', { count: need })}
      </Text>
      <Text className="font-sans mt-1 text-sm text-text-medium">
        {t('employer:jobs.tokenNeed', {
          need,
          available: available ?? '—',
        })}
      </Text>
      <Text className="font-sans mt-2 text-sm text-text-low">
        {t('employer:jobs.tokenExplain')}
      </Text>
    </ClayCard>
  );
}
