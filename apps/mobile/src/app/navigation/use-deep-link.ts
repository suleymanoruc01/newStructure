import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';

import {
  openRoute,
  peekPending,
  pickRoute,
  subscribePending,
  takePending,
} from './deep-link';

export function useDeepLink(screenTab?: Record<string, string>): void {
  const navigation = useNavigation();

  useEffect(() => {
    const apply = () => {
      const target = peekPending();
      if (!target) {
        return;
      }
      const names = navigation.getState()?.routeNames ?? [];
      const direct = pickRoute(target, names);
      if (direct) {
        takePending();
        openRoute(navigation, direct);
        return;
      }
      if (!screenTab) {
        return;
      }
      const viaTab = pickRoute(target, Object.keys(screenTab));
      if (!viaTab) {
        return;
      }
      const tab = screenTab[viaTab.name];
      if (!tab || !names.includes(tab)) {
        return;
      }
      takePending();
      const nav = navigation as unknown as {
        navigate: (name: string, params?: object) => void;
      };
      if (viaTab.name === tab) {
        nav.navigate(tab);
        return;
      }
      nav.navigate(tab, { screen: viaTab.name, params: viaTab.params });
    };
    apply();
    return subscribePending(apply);
  }, [navigation, screenTab]);
}
