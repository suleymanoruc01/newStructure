export function uniqueJobBranches(
  jobs: { branchId: string | null; branchName?: string | null }[],
): { branchId: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const job of jobs) {
    if (!job.branchId || seen.has(job.branchId)) {
      continue;
    }
    seen.set(job.branchId, job.branchName?.trim() || job.branchId);
  }
  return [...seen.entries()].map(([branchId, label]) => ({ branchId, label }));
}
