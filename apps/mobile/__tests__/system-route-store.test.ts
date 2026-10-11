import {
  clearSystemRoute,
  getSystemRoute,
  openSystemRoute,
} from '../src/shared/system/system-route-store';

describe('system route store', () => {
  afterEach(() => {
    clearSystemRoute();
  });

  it('opens forbidden and session-expired, then clears', () => {
    expect(getSystemRoute()).toBeNull();
    openSystemRoute('forbidden');
    expect(getSystemRoute()).toBe('forbidden');
    openSystemRoute('session-expired');
    expect(getSystemRoute()).toBe('session-expired');
    clearSystemRoute();
    expect(getSystemRoute()).toBeNull();
  });
});
