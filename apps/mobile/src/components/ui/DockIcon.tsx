import React from 'react';
import { View } from 'react-native';

export type DockIconName =
  | 'home'
  | 'jobs'
  | 'calendar'
  | 'profile'
  | 'branches'
  | 'alerts';

type Props = {
  name: DockIconName;
  color: string;
};

export function DockIcon({ name, color }: Props) {
  switch (name) {
    case 'home':
      return (
        <View style={{ width: 22, height: 22 }}>
          <View
            style={{
              position: 'absolute',
              top: 2,
              left: 4,
              width: 12,
              height: 12,
              borderTopWidth: 2,
              borderLeftWidth: 2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 1,
              left: 5,
              width: 12,
              height: 9,
              borderWidth: 2,
              borderColor: color,
            }}
          />
        </View>
      );
    case 'jobs':
      return (
        <View style={{ width: 22, height: 22, justifyContent: 'center', gap: 3 }}>
          <View style={{ height: 2, backgroundColor: color }} />
          <View style={{ height: 2, width: 16, backgroundColor: color }} />
          <View style={{ height: 2, width: 12, backgroundColor: color }} />
        </View>
      );
    case 'calendar':
      return (
        <View
          style={{
            width: 20,
            height: 18,
            borderWidth: 2,
            borderColor: color,
            borderRadius: 3,
            marginTop: 2,
          }}
        >
          <View style={{ height: 4, backgroundColor: color }} />
        </View>
      );
    case 'profile':
      return (
        <View style={{ width: 22, height: 22, alignItems: 'center' }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: color,
            }}
          />
          <View
            style={{
              marginTop: 2,
              width: 14,
              height: 7,
              borderTopLeftRadius: 7,
              borderTopRightRadius: 7,
              borderWidth: 2,
              borderColor: color,
            }}
          />
        </View>
      );
    case 'branches':
      return (
        <View style={{ width: 22, height: 22, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
          <View style={{ width: 6, height: 14, borderWidth: 2, borderColor: color }} />
          <View style={{ width: 6, height: 18, borderWidth: 2, borderColor: color }} />
          <View style={{ width: 6, height: 10, borderWidth: 2, borderColor: color }} />
        </View>
      );
    case 'alerts':
      return (
        <View style={{ width: 22, height: 22, alignItems: 'center' }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              borderWidth: 2,
              borderBottomWidth: 0,
              borderColor: color,
              marginTop: 2,
            }}
          />
          <View style={{ width: 16, height: 2, backgroundColor: color }} />
        </View>
      );
    default: {
      const unreachable: never = name;
      return unreachable;
    }
  }
}
