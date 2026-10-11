export type PermissionMoment = 'launch' | 'inbox' | 'check-in';

/** WWDC26 responsibility: ask only at the moment the person can see why. */
export function mayRequestNotifications(moment: PermissionMoment): boolean {
  return moment === 'inbox';
}

/** Location is for check-in, not for opening the app. */
export function mayRequestLocation(moment: PermissionMoment): boolean {
  return moment === 'check-in';
}
