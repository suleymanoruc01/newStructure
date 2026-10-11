import type { IdentityProvider } from '@parton/api-contracts';
import appleAuth from '@invertase/react-native-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

export function platformIdentityProvider(): IdentityProvider | null {
  if (Platform.OS === 'ios') {
    return 'apple';
  }
  if (Platform.OS === 'android') {
    return 'google';
  }
  return null;
}

export async function requestIdentityToken(
  provider: IdentityProvider,
  googleClientId: string,
): Promise<string> {
  switch (provider) {
    case 'apple': {
      const response = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL],
      });
      if (!response.identityToken) {
        throw new Error('missing-identity-token');
      }
      return response.identityToken;
    }
    case 'google': {
      GoogleSignin.configure({ webClientId: googleClientId });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      const idToken = result.data?.idToken;
      if (!idToken) {
        throw new Error('missing-identity-token');
      }
      return idToken;
    }
    default: {
      const neverProvider: never = provider;
      throw new Error(String(neverProvider));
    }
  }
}
