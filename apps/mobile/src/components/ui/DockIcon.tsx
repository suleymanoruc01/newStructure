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
        <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              position: 'absolute',
              top: 2,
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
              bottom: 2,
              width: 13,
              height: 10,
              borderWidth: 2,
              borderTopWidth: 0,
              borderColor: color,
            }}
          />
        </View>
      );
    case 'jobs':
      return (
        <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              width: 8,
              height: 4,
              borderTopWidth: 2,
              borderLeftWidth: 2,
              borderRightWidth: 2,
              borderColor: color,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
              marginBottom: -1,
            }}
          />
          <View
            style={{
              width: 18,
              height: 12,
              borderWidth: 2,
              borderColor: color,
              borderRadius: 3,
              justifyContent: 'center',
            }}
          >
            <View style={{ height: 1.5, width: '100%', backgroundColor: color, opacity: 0.5 }} />
          </View>
        </View>
      );
    case 'calendar':
      return (
        <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', width: 12, justifyContent: 'space-between', marginBottom: -2, zIndex: 1 }}>
            <View style={{ width: 2, height: 3, backgroundColor: color, borderRadius: 1 }} />
            <View style={{ width: 2, height: 3, backgroundColor: color, borderRadius: 1 }} />
          </View>
          <View
            style={{
              width: 18,
              height: 14,
              borderWidth: 2,
              borderColor: color,
              borderRadius: 3,
              paddingTop: 3,
              alignItems: 'center',
            }}
          >
            <View style={{ width: 14, height: 1.5, backgroundColor: color, opacity: 0.6 }} />
          </View>
        </View>
      );
    case 'profile':
      return (
        <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
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
              width: 16,
              height: 8,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              borderWidth: 2,
              borderColor: color,
            }}
          />
        </View>
      );
    case 'branches':
      return (
        <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              width: 18,
              height: 5,
              borderTopWidth: 2,
              borderLeftWidth: 2,
              borderRightWidth: 2,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
              borderColor: color,
            }}
          />
          <View
            style={{
              width: 18,
              height: 10,
              borderWidth: 2,
              borderTopWidth: 0,
              borderColor: color,
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'flex-end',
            }}
          >
            <View style={{ width: 4, height: 6, backgroundColor: color, borderTopLeftRadius: 1, borderTopRightRadius: 1 }} />
          </View>
        </View>
      );
    case 'alerts':
      return (
        <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              width: 12,
              height: 11,
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              borderWidth: 2,
              borderBottomWidth: 0,
              borderColor: color,
            }}
          />
          <View style={{ width: 16, height: 2, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: 4, height: 2, backgroundColor: color, marginTop: 1, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }} />
        </View>
      );
    default: {
      const unreachable: never = name;
      return unreachable;
    }
  }
}
