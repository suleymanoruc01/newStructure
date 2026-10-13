import type { MeUser } from '@parton/api-contracts';

export type ManagerJoinData = {
  branch?: {
    id: string;
    name: string;
    city?: string | null;
    employerId: string;
    employerName: string;
  };
  workplace?: {
    id: string;
    name: string;
  };
  accessToken: string;
  accessExpiresAt: string;
  refreshToken: string;
  user: MeUser;
};
