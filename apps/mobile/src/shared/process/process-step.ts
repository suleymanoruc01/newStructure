export function processDoneCount(
  status: string | null,
  hasShift: boolean,
): number {
  let done = 1;
  if (status != null && status !== 'pending') {
    done = 3;
  } else if (status === 'pending') {
    done = 2;
  }
  if (hasShift) {
    done = 4;
  }
  return done;
}
