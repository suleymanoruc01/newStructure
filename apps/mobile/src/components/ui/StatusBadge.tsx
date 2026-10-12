import React from 'react';
import { Text, View } from 'react-native';

export type StatusTone = 'neutral' | 'strong' | 'warn' | 'error';

export function statusTone(status: string): StatusTone {
  switch (status) {
    case 'awaiting_confirm':
    case 'scheduled':
    case 'pending':
    case 'draft':
    case 'open':
      return 'warn';
    case 'can_come':
    case 'checked_in':
    case 'completed':
    case 'published':
    case 'accepted':
    case 'manual_confirmed':
    case 'substitute':
    case 'uploaded':
    case 'active':
    case 'verified':
    case 'approved':
    case 'bypass':
      return 'strong';
    case 'cannot_come':
    case 'released':
    case 'rejected':
    case 'closed':
    case 'withdrawn':
    case 'accept_revoked':
    case 'archived':
    case 'cancelled':
    case 'restricted':
    case 'banned':
      return 'error';
    case 'pending_upload':
    case 'inactive':
      return 'warn';
    default:
      return 'neutral';
  }
}

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: StatusTone;
}) {
  const fill =
    tone === 'strong'
      ? 'bg-action-primary'
      : tone === 'error'
        ? 'bg-feedback-error'
        : tone === 'warn'
          ? 'bg-feedback-warning'
          : 'bg-surface-2';
  const text = tone === 'neutral' ? 'text-text-high' : 'text-text-on';
  return (
    <View className={`self-start rounded-full px-3 py-1 ${fill}`}>
      <Text className={`font-sans text-xs font-semibold ${text}`}>{label}</Text>
    </View>
  );
}
