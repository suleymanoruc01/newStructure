import { notificationTypeLabel } from './type-label';

test('turns snake and dotted types into readable chips', () => {
  expect(notificationTypeLabel('job.matched')).toBe('job matched');
  expect(notificationTypeLabel('APPLICATION_APPROVED')).toBe(
    'APPLICATION APPROVED',
  );
});
