export function notificationTypeLabel(type: string): string {
  return type.replace(/[._]/g, ' ').trim();
}
