import { mayRequestLocation, mayRequestNotifications } from './permission-moment';

describe('permission moment', () => {
  it('does not ask for notifications at launch', () => {
    expect(mayRequestNotifications('launch')).toBe(false);
    expect(mayRequestNotifications('check-in')).toBe(false);
    expect(mayRequestNotifications('inbox')).toBe(true);
  });

  it('asks for location only at check-in', () => {
    expect(mayRequestLocation('launch')).toBe(false);
    expect(mayRequestLocation('inbox')).toBe(false);
    expect(mayRequestLocation('check-in')).toBe(true);
  });
});
