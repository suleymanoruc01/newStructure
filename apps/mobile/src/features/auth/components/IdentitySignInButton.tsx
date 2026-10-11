import type { IdentityProvider } from '@parton/api-contracts';
import { AppleButton } from '@invertase/react-native-apple-authentication';
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import React from 'react';
import { View } from 'react-native';

const HEIGHT = 56;
const RADIUS = 28;

type IdentitySignInButtonProps = {
  provider: IdentityProvider;
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
};

/** Official mark and label. Same height and radius as the other auth capsules. */
export function IdentitySignInButton({
  provider,
  disabled = false,
  onPress,
  testID,
}: IdentitySignInButtonProps) {
  if (provider === 'apple') {
    return (
      <View pointerEvents={disabled ? 'none' : 'auto'} style={{ opacity: disabled ? 0.45 : 1 }}>
        <AppleButton
          buttonStyle={AppleButton.Style.BLACK}
          buttonType={AppleButton.Type.SIGN_IN}
          cornerRadius={RADIUS}
          onPress={onPress}
          style={{ width: '100%', height: HEIGHT }}
          testID={testID}
        />
      </View>
    );
  }

  if (provider === 'google') {
    return (
      <GoogleSigninButton
        color={GoogleSigninButton.Color.Light}
        disabled={disabled}
        onPress={onPress}
        size={GoogleSigninButton.Size.Wide}
        style={{ width: '100%', height: HEIGHT, borderRadius: RADIUS, overflow: 'hidden' }}
        testID={testID}
      />
    );
  }

  const neverProvider: never = provider;
  return neverProvider;
}
