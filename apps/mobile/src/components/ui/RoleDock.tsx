import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import React, { useEffect, useState } from 'react';
import { Platform, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useDeepLink } from '../../app/navigation/use-deep-link';
import { dockHidden } from '../../app/navigation/dock-routes';
import { listNotifications } from '../../api/notifications-api';
import { getAccessToken } from '../../shared/auth/session-memory';
import { DockIcon, type DockIconName } from './DockIcon';
import { Pressable } from './Pressable';

const CANVAS = '#F3E8CF';
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
  const raised = items.find((item) => item.raised);
  const rest = items.filter((item) => !item.raised);

  return (
    <View pointerEvents="box-none" style={{ backgroundColor: 'transparent' }}>
      <DockShelf
        style={{
          marginTop: 22,
          overflow: 'hidden',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 10,
          paddingBottom: Math.max(bottomInset, 8),
          paddingHorizontal: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          {raised ? (
            <View style={{ width: 76, alignItems: 'center' }}>
              <Text
                className="font-sans"
                style={{ fontSize: 11, color: FOREST, fontWeight: '600' }}
              >
                {raised.label}
              </Text>
            </View>
          ) : null}
          {rest.map((item) => {
            const active = item.key === activeKey;
            const color = active ? FOREST : MUTED;
            return (
              <Pressable
                key={item.key}
                accessibilityLabel={item.label}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => onPress(item.key)}
                style={{ flex: 1, alignItems: 'center', minHeight: 48, justifyContent: 'flex-end' }}
              >
                <View>
                  <DockIcon color={color} name={item.icon} />
                  {item.badge && item.badge > 0 ? (
                    <View
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -10,
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
                  className="font-sans"
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color,
                    fontWeight: active ? '600' : '500',
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </DockShelf>
      {raised ? (
        <>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 12,
              top: 0,
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: CANVAS,
            }}
          />
          <Pressable
            accessibilityLabel={raised.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: raised.key === activeKey }}
            onPress={() => onPress(raised.key)}
            style={{
              position: 'absolute',
              left: 20,
              top: 8,
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: raised.key === activeKey ? FOREST : CANVAS,
              borderWidth: 1.5,
              borderColor: FOREST,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DockIcon
              color={raised.key === activeKey ? CREAM : FOREST}
              name={raised.icon}
            />
          </Pressable>
        </>
      ) : null}
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
          setCount(data.items.filter((item) => item.readAt == null).length);
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

  return (
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
