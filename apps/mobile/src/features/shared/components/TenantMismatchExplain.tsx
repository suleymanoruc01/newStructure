import React from 'react';
import { Text } from 'react-native';

import { ClayCard } from '../../../components/ui/ClayCard';

type Props = {
  hint: string;
};

export function TenantMismatchExplain({ hint }: Props) {
  return (
    <ClayCard className="mt-6">
      <Text className="font-sans text-sm text-text-medium">{hint}</Text>
    </ClayCard>
  );
}
