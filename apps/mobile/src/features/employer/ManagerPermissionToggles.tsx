import { MANAGER_PERMISSIONS, type ManagerPermission } from '@parton/api-contracts';
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ClayChip } from '../../components/ui/ClayChip';

export function ManagerPermissionToggles({
  value,
  onChange,
  disabled,
}: {
  value: ManagerPermission[];
  onChange: (next: ManagerPermission[]) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation('employer');
  return (
    <View className="flex-row flex-wrap gap-2">
      {MANAGER_PERMISSIONS.map((perm) => {
        const selected = value.includes(perm);
        return (
          <ClayChip
            key={perm}
            label={t(`managers.perm.${perm}`)}
            selected={selected}
            onPress={() => {
              if (disabled) {
                return;
              }
              onChange(
                selected
                  ? value.filter((item) => item !== perm)
                  : [...value, perm],
              );
            }}
          />
        );
      })}
    </View>
  );
}
