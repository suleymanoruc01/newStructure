import type { LinkingOptions } from '@react-navigation/native';

import type { AuthStackParamList, RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['parton://', 'https://app.parton.com'],
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
};
