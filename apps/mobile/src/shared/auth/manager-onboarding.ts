export function managerOnboardingComplete(
  contexts: { role: string; employerId?: string }[],
): boolean {
  return contexts.some(
    (ctx) => ctx.role === 'manager' && Boolean(ctx.employerId),
  );
}
