import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import React, { useEffect, useState } from 'react';
import { Platform, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useDeepLink } from '../../app/navigation/use-deep-link';
import { dockHidden, workerShiftRoute } from '../../app/navigation/dock-routes';
import { listNotifications } from '../../api/notifications-api';
import { getAccessToken } from '../../shared/auth/session-memory';
import { ActiveShiftCapsule } from '../shifts/ActiveShiftCapsule';
import { DockIcon, type DockIconName } from './DockIcon';
import { Pressable } from './Pressable';

const SHELF = '#FBF6EC';
const FOREST = '#344A32';
const CREAM = '#F3E8CF';
const MUSTARD = '#E2B83F';
const CHARCOAL = '#252823';
const MUTED = '#83947A';

export type DockItem = {
  key: string;
  label: string;
  icon: DockIconName;
  raised?: boolean;
  badge?: number;
};

type DockProps = {
  items: DockItem[];
  activeKey: string;
  onPress: (key: string) => void;
  bottomInset: number;
};

function DockShelf({
  children,
  style,
}: {
  children: React.ReactNode;
  style: StyleProp<ViewStyle>;
}) {
  if (Platform.OS !== 'ios') {
    return <View style={[style, { backgroundColor: SHELF }]}>{children}</View>;
  }
  return (
    <BlurView
      blurAmount={40}
      blurType="systemChromeMaterialLight"
      reducedTransparencyFallbackColor={SHELF}
      style={style}
    >
      {children}
    </BlurView>
  );
}

export function RoleDock({ items, activeKey, onPress, bottomInset }: DockProps) {
  return (
    <View style={{ backgroundColor: 'transparent' }}>
      <DockShelf
        style={{
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderTopWidth: 2,
          borderTopColor: CREAM,
          paddingTop: 8,
          paddingBottom: Math.max(bottomInset, 8),
          paddingHorizontal: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
          {items.map((item) => {
            const active = item.key === activeKey;
            const color = active ? FOREST : MUTED;
            return (
              <View key={item.key} style={{ flexGrow: 1, flexBasis: 0 }}>
                <Pressable
                  accessibilityLabel={item.label}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  pressScale={false}
                  onPress={() => onPress(item.key)}
                  style={{ alignItems: 'center', paddingVertical: 2 }}
                >
                  <View
                    style={{
                      minWidth: 46,
                      height: 32,
                      paddingHorizontal: 12,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: active ? 'rgba(28, 58, 39, 0.12)' : 'transparent',
                    }}
                  >
                    <DockIcon color={color} name={item.icon} />
                    {item.badge && item.badge > 0 ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: -2,
                          right: -2,
                          minWidth: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: MUSTARD,
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 3,
                        }}
                      >
                        <Text style={{ color: CHARCOAL, fontSize: 10, fontWeight: '700' }}>
                          {item.badge > 9 ? '9+' : String(item.badge)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{
                      marginTop: 3,
                      fontSize: 11,
                      lineHeight: 14,
                      textAlign: 'center',
                      color,
                      fontWeight: active ? '700' : '500',
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </DockShelf>
    </View>
  );
}

function useUnreadCount(refreshKey: number): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = getAccessToken();
      if (!token) {
        return;
      }
      try {
        const data = await listNotifications(token);
        if (!cancelled) {
          setCount((data.items ?? []).filter((item) => item.readAt == null).length);
        }
      } catch {
        // Badge stays at the last known count.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return count;
}

type DockTabBarProps = BottomTabBarProps & {
  items: DockItem[];
  badgeKey: string;
  screenTab: Record<string, string>;
};

export function DockTabBar({
  state,
  navigation,
  insets,
  items,
  badgeKey,
  screenTab,
}: DockTabBarProps) {
  useDeepLink(screenTab);
  const unread = useUnreadCount(state.index);
  const focused = state.routes[state.index];
  const nested =
    focused && 'state' in focused && focused.state && 'index' in focused.state
      ? focused.state.index
      : undefined;
  if (!focused || dockHidden(nested)) {
    return null;
  }

  const withBadge = items.map((item) =>
    item.key === badgeKey ? { ...item, badge: unread } : item,
  );

  const isWorkerRole = screenTab.WorkerHomeRoot === 'WorkerHome';

  return (
    <View style={{ backgroundColor: 'transparent' }}>
      {isWorkerRole ? (
        <ActiveShiftCapsule
          onPress={(shift) => {
            const targetScreen = workerShiftRoute(shift.status);
            if (targetScreen) {
              navigation.navigate('WorkerHome', {
                screen: targetScreen,
                params: { shiftId: shift.id },
              });
            }
          }}
        />
      ) : null}
      <RoleDock
        activeKey={focused.name}
        bottomInset={insets.bottom}
        items={withBadge}
        onPress={(key) => {
          const route = state.routes.find((entry) => entry.name === key);
          if (!route) {
            return;
          }
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }}
      />
    </View>
  );
}

export function useDockItems(
  kind: 'worker' | 'employer' | 'manager',
): { items: DockItem[]; badgeKey: string } {
  const { t } = useTranslation('common');
  if (kind === 'worker') {
    return {
      badgeKey: 'WorkerProfile',
      items: [
        { key: 'WorkerHome', label: t('dock.home'), icon: 'home', raised: true },
        { key: 'WorkerJobs', label: t('dock.jobs'), icon: 'jobs' },
        { key: 'WorkerCalendar', label: t('dock.calendar'), icon: 'calendar' },
        { key: 'WorkerProfile', label: t('dock.profile'), icon: 'profile' },
      ],
    };
  }
  if (kind === 'manager') {
    return {
      badgeKey: 'ManagerAlerts',
      items: [
        { key: 'ManagerHome', label: t('dock.home'), icon: 'home', raised: true },
        { key: 'ManagerJobs', label: t('dock.jobs'), icon: 'jobs' },
        { key: 'ManagerAlerts', label: t('dock.alerts'), icon: 'alerts' },
        { key: 'ManagerProfile', label: t('dock.profile'), icon: 'profile' },
      ],
    };
  }
  return {
    badgeKey: 'EmployerProfile',
    items: [
      { key: 'EmployerHome', label: t('dock.home'), icon: 'home', raised: true },
      { key: 'EmployerJobs', label: t('dock.jobs'), icon: 'jobs' },
      { key: 'EmployerBranches', label: t('dock.branches'), icon: 'branches' },
      { key: 'EmployerProfile', label: t('dock.profile'), icon: 'profile' },
    ],
  };
}
