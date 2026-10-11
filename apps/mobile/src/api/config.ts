import { Platform } from 'react-native';

const devHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

/** Local Nest API base (override via native build config in CI). */
export const API_BASE_URL = `http://${devHost}:3000/api/v1`;

export const API_REQUEST_TIMEOUT_MS = 30_000;
