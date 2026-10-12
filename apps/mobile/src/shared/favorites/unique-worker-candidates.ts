export function uniqueWorkerCandidates(
  applications: Array<{
    workerUserId: string;
    workerDisplayName?: string | null;
  }>,
  favorited: Iterable<string>,
  fallback: string,
): Array<{ workerUserId: string; label: string }> {
  const seen = new Set(favorited);
  const next: Array<{ workerUserId: string; label: string }> = [];
  for (const application of applications) {
    if (seen.has(application.workerUserId)) {
      continue;
    }
    seen.add(application.workerUserId);
    next.push({
      workerUserId: application.workerUserId,
      label: application.workerDisplayName ?? fallback,
    });
  }
  return next;
}
