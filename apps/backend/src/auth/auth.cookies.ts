import type { Response } from 'express';

import { AppConfigService } from '../config/app-config.service.js';

export function setAuthCookies(
  res: Response,
  config: AppConfigService,
  refreshToken: string,
  refreshExpiresAt: Date,
  csrfToken: string,
): void {
  const secure = config.env.COOKIE_SECURE;
  const refreshName = config.env.REFRESH_COOKIE_NAME;
  const csrfName = config.env.CSRF_COOKIE_NAME;
  res.cookie(refreshName, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    expires: refreshExpiresAt,
    path: '/api/v1/auth',
  });
  res.cookie(csrfName, csrfToken, {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    expires: refreshExpiresAt,
    path: '/',
  });
}

export function clearAuthCookies(res: Response, config: AppConfigService): void {
  res.clearCookie(config.env.REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
  res.clearCookie(config.env.CSRF_COOKIE_NAME, { path: '/' });
}

export function readRefreshFromRequest(
  req: { cookies?: Record<string, string>; body?: { refreshToken?: string } },
  config: AppConfigService,
): string | null {
  const fromCookie = req.cookies?.[config.env.REFRESH_COOKIE_NAME];
  if (fromCookie) {
    return fromCookie;
  }
  const fromBody = req.body?.refreshToken;
  if (typeof fromBody === 'string' && fromBody.length > 0) {
    return fromBody;
  }
  return null;
}
