import { z } from 'zod';

export const notificationTypeSchema = z.string().min(1);

export const notificationSchema = z.object({
  id: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: z.record(z.string(), z.string()),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type Notification = z.infer<typeof notificationSchema>;

export const pushTokenRegisterBodySchema = z.object({
  token: z.string().min(32).max(4096),
  platform: z.enum(['android', 'ios']),
  deviceId: z.string().min(1).max(128).optional(),
  appVersion: z.string().min(1).max(32).optional(),
});

export type PushTokenRegisterBody = z.infer<typeof pushTokenRegisterBodySchema>;

export const notificationPreferencesSchema = z.object({
  shifts: z.boolean(),
  applications: z.boolean(),
  matching: z.boolean(),
  favorites: z.boolean(),
  marketing: z.boolean(),
});

export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>;

export const notificationPreferencesPatchSchema =
  notificationPreferencesSchema.partial();

export type NotificationPreferencesPatch = z.infer<
  typeof notificationPreferencesPatchSchema
>;
