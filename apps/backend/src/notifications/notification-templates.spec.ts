import { describe, expect, it } from 'vitest';

import { renderNotification } from './notification-templates.js';

describe('renderNotification', () => {
  it('renders job.matched and job.favorites_only copy', () => {
    const matched = renderNotification('job.matched', {
      jobTitle: 'Garson',
      branchName: 'İstanbul',
      startLocal: '12.10.2026 14:00',
    });
    expect(matched.category).toBe('matching');
    expect(matched.title).toBe('Yeni iş fırsatı');
    expect(matched.body).toContain('Garson');

    const favOnly = renderNotification('job.favorites_only', {
      employerName: 'PartOn AŞ',
    });
    expect(favOnly.category).toBe('favorites');
    expect(favOnly.title).toBe('Sana özel ilan');
    expect(favOnly.body).toContain('PartOn AŞ');
  });

  it('falls back for unknown types without throwing', () => {
    const unknown = renderNotification('job.not_a_real_type', {});
    expect(unknown.title).toBe('PartOn');
    expect(unknown.body).toBe('Yeni bir bildiriminiz var.');
  });

  it('renders notifications in English when locale is en', () => {
    const accepted = renderNotification('application.accepted', {
      jobTitle: 'Barista',
      branchName: 'Kadıköy',
      startLocal: '15.10.2026 09:00',
      locale: 'en',
    });
    expect(accepted.category).toBe('applications');
    expect(accepted.title).toBe('Application Accepted');
    expect(accepted.body).toContain('Barista');

    const checkIn = renderNotification('shift.checkin_due', {
      jobTitle: 'Barista',
      locale: 'en',
    });
    expect(checkIn.category).toBe('shifts');
    expect(checkIn.title).toBe('Check-in Time');

    const unknownEn = renderNotification('job.not_a_real_type', { locale: 'en' });
    expect(unknownEn.title).toBe('PartOn');
    expect(unknownEn.body).toBe('You have a new notification.');
  });
});
