import { mayRequestLocation, mayRequestNotifications } from './permission-moment';

describe('permission moment', () => {
  it('does not ask for notifications at launch', () => {
    expect(mayRequestNotifications('launch')).toBe(false);
    expect(mayRequestNotifications('check-in')).toBe(false);
    expect(mayRequestNotifications('inbox')).toBe(true);
  });

  it('asks for location at check-in and pin pick, never at launch', () => {
    expect(mayRequestLocation('launch')).toBe(false);
    expect(mayRequestLocation('inbox')).toBe(false);
    expect(mayRequestLocation('check-in')).toBe(true);
    expect(mayRequestLocation('pin-pick')).toBe(true);
  });
});
