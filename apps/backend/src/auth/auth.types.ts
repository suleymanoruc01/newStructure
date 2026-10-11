import type { AuthContext, UserRole } from '@parton/api-contracts';

export type JwtPayload = {
  sub: string;
  sid: string;
  ctx: AuthContext;
  ver: 1;
};

export type ResolvedAuthContext = AuthContext;

export type SessionIssueResult = {
  accessToken: string;
  accessExpiresAt: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  csrfToken: string;
};

export type AuthenticatedUser = {
  id: string;
  phoneE164: string;
  locale: string;
};

export const DEFAULT_ROLE: UserRole = 'worker';
