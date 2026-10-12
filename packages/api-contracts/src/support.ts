import { z } from 'zod';

import { successEnvelopeSchema } from './envelope.js';

export const supportTicketStatusSchema = z.enum([
  'open',
  'in_progress',
  'resolved',
  'closed',
]);

export const supportTicketPrioritySchema = z.enum(['low', 'normal', 'high']);

export const supportTicketCreateSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  body: z.string().trim().min(10).max(4000),
});

export type SupportTicketCreateBody = z.infer<typeof supportTicketCreateSchema>;

export const supportTicketMessageCreateSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export type SupportTicketMessageCreateBody = z.infer<
  typeof supportTicketMessageCreateSchema
>;

export const supportTicketMessageSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  authorUserId: z.string().uuid(),
  body: z.string(),
  isStaff: z.boolean(),
  createdAt: z.string().datetime(),
});

export const supportTicketSchema = z.object({
  id: z.string().uuid(),
  subject: z.string(),
  body: z.string(),
  status: supportTicketStatusSchema,
  priority: supportTicketPrioritySchema,
  requesterUserId: z.string().uuid(),
  assignedAdminUserId: z.string().uuid().nullable(),
  resolvedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const supportTicketDetailSchema = supportTicketSchema.extend({
  messages: z.array(supportTicketMessageSchema),
});

export const supportTicketListDataSchema = z.object({
  items: z.array(supportTicketSchema),
});

export const supportTicketResponseSchema = successEnvelopeSchema(
  supportTicketSchema,
);

export const supportTicketDetailResponseSchema = successEnvelopeSchema(
  supportTicketDetailSchema,
);

export const supportTicketListResponseSchema = successEnvelopeSchema(
  supportTicketListDataSchema,
);

export const adminSupportTicketPatchSchema = z.object({
  status: supportTicketStatusSchema.optional(),
  priority: supportTicketPrioritySchema.optional(),
  assignedAdminUserId: z.string().uuid().nullable().optional(),
});

export type AdminSupportTicketPatchBody = z.infer<
  typeof adminSupportTicketPatchSchema
>;
