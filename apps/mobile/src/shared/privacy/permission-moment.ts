export type PermissionMoment = 'launch' | 'inbox' | 'check-in' | 'pin-pick';

/** WWDC26 responsibility: ask only at the moment the person can see why. */
export function mayRequestNotifications(moment: PermissionMoment): boolean {
  return moment === 'inbox';
}

/** Location: check-in geofence or an on-screen pin pick — never at launch. */
export function mayRequestLocation(moment: PermissionMoment): boolean {
  return moment === 'check-in' || moment === 'pin-pick';
}
