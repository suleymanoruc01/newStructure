import {
  getStateFromPath as parseNavigationState,
  type LinkingOptions,
} from '@react-navigation/native';

import { parseAppPath, queueDeepLink } from './deep-link';
import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['parton://', 'https://app.parton.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          AuthTutorial: 'auth/tutorial',
          AuthPhone: 'auth/phone',
          AuthOtp: {
            path: 'auth/otp',
            parse: {
              challengeId: (value: string) => value,
            },
          },
          AuthRoleSelect: 'auth/role',
          AuthPolicies: 'auth/policies',
        },
      },
    },
  },
  getStateFromPath(path, options) {
    const target = parseAppPath(path);
    if (target) {
      queueDeepLink(target);
      return undefined;
    }
    return parseNavigationState(path, options);
  },
};
