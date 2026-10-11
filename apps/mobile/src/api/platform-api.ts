import { platformRemoteConfigResponseSchema } from '@parton/api-contracts';

import { apiRequest } from './client';

export async function fetchPlatformRemoteConfig() {
  return apiRequest('/platform/remote-config', platformRemoteConfigResponseSchema);
}
