export function uniqueJobBranches(
  jobs: { branchId: string; branchName?: string | null }[],
): { branchId: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const job of jobs) {
    if (!seen.has(job.branchId)) {
      seen.set(job.branchId, job.branchName?.trim() || job.branchId);
    }
  }
  return [...seen.entries()].map(([branchId, label]) => ({ branchId, label }));
}
