import { uniqueJobBranches } from './unique-branches';

test('keeps first label per branchId', () => {
  expect(
    uniqueJobBranches([
      { branchId: 'a', branchName: 'Kadıköy' },
      { branchId: 'a', branchName: 'ignored' },
      { branchId: 'b' },
    ]),
  ).toEqual([
    { branchId: 'a', label: 'Kadıköy' },
    { branchId: 'b', label: 'b' },
  ]);
});
