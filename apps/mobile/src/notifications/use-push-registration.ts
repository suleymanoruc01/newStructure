import { useEffect } from 'react';

import { getAccessToken } from '../shared/auth/session-memory';
import { startPushRegistration } from './push-registration';

export function usePushRegistration(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const accessToken = getAccessToken();
    if (!accessToken) {
      return;
    }
    return startPushRegistration(accessToken);
  }, [enabled]);
}
