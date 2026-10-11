import type { Employer, MeUser } from '@parton/api-contracts';

export type EmployerCreateData = {
  employer: Employer;
  accessToken: string;
  accessExpiresAt: string;
  refreshToken: string;
  user: MeUser;
};
