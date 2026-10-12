import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { matchProvinces } from '../../shared/location/tr-provinces';
import { Pressable } from './Pressable';
import { TextField } from './TextField';

export function CityChips({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (city: string) => void;
}) {
  const { t } = useTranslation('common');
  const [query, setQuery] = useState('');
  const shown = matchProvinces(query);
  const extra =
    value && !shown.includes(value) ? [value] : [];

  return (
    <View className="gap-2">
      <TextField
        inset
        shape="capsule"
        label={label}
        onChangeText={setQuery}
        value={query}
      />
      <View className="flex-row flex-wrap gap-2">
        {[...extra, ...shown].map((city) => (
          <Pressable
            key={city}
            className={`rounded-full px-3 py-2 ${
              value === city ? 'bg-action-primary' : 'bg-surface-1'
            }`}
            onPress={() => onChange(city)}
          >
            <Text
              className={`font-sans text-sm ${
                value === city ? 'text-text-on' : 'text-text-high'
              }`}
            >
              {city}
            </Text>
          </Pressable>
        ))}
        {query.trim() && shown.length === 0 ? (
          <Text className="font-sans text-sm text-text-medium">
            {t('noMatch')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
