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
});
