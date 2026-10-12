import { uniqueWorkerCandidates } from './unique-worker-candidates';

test('skips already favorited and duplicate workers', () => {
  const rows = uniqueWorkerCandidates(
    [
      { workerUserId: 'a', workerDisplayName: 'Ada' },
      { workerUserId: 'b', workerDisplayName: null },
      { workerUserId: 'a', workerDisplayName: 'Ada again' },
      { workerUserId: 'c', workerDisplayName: 'Can' },
    ],
    ['c'],
    'İş arayan',
  );
  expect(rows).toEqual([
    { workerUserId: 'a', label: 'Ada' },
    { workerUserId: 'b', label: 'İş arayan' },
  ]);
});
