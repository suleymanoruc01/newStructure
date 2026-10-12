import { jobsListTabStatuses } from './jobs-list-tab';

test('maps jobs tabs to application or shift statuses', () => {
  expect(jobsListTabStatuses('applied')).toEqual(['pending']);
  expect(jobsListTabStatuses('approved')).toEqual(['accepted', 'substitute']);
  expect(jobsListTabStatuses('previous')).toEqual(['completed', 'released']);
});
