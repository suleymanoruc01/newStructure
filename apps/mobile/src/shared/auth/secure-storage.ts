import * as Keychain from 'react-native-keychain';

const REFRESH_SERVICE = 'parton.refresh';
const DEVICE_SERVICE = 'parton.device';

function newInstallId(): string {
  const bytes = new Uint8Array(16);
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function loadOrCreateDeviceInstallId(): Promise<string> {
  const existing = await Keychain.getGenericPassword({ service: DEVICE_SERVICE });
  if (existing && existing.password.length >= 8) {
    return existing.password;
  }
  const created = newInstallId();
  await Keychain.setGenericPassword('device', created, {
    service: DEVICE_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return created;
}

export async function saveRefreshToken(refreshToken: string): Promise<void> {
  await Keychain.setGenericPassword('refresh', refreshToken, {
    service: REFRESH_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadRefreshToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: REFRESH_SERVICE,
  });
  if (!credentials) {
    return null;
  }
  return credentials.password;
}

export async function clearRefreshToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: REFRESH_SERVICE });
}
