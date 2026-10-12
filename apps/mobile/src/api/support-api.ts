import {
  supportTicketCreateSchema,
  supportTicketResponseSchema,
  type SupportTicketCreateBody,
} from '@parton/api-contracts';

import { apiRequest } from './client';

export async function createSupportTicket(
  accessToken: string,
  body: SupportTicketCreateBody,
) {
  const parsed = supportTicketCreateSchema.parse(body);
  return apiRequest('/support/tickets', supportTicketResponseSchema, {
    method: 'POST',
    accessToken,
    body: parsed,
  });
}
