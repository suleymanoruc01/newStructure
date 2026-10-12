import { statusTone } from './StatusBadge';

test('shift and application statuses map to a visible tone', () => {
  expect(statusTone('awaiting_confirm')).toBe('warn');
  expect(statusTone('can_come')).toBe('strong');
  expect(statusTone('rejected')).toBe('error');
  expect(statusTone('completed')).toBe('strong');
  expect(statusTone('uploaded')).toBe('strong');
  expect(statusTone('verified')).toBe('strong');
  expect(statusTone('archived')).toBe('error');
  expect(statusTone('open')).toBe('warn');
});
