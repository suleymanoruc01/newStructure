export type DeepLinkRoute = {
  name: string;
  params?: Record<string, string>;
};

export type DeepLinkTarget = {
  primary: DeepLinkRoute;
  alternate?: DeepLinkRoute;
};

const listeners = new Set<() => void>();
let pending: DeepLinkTarget | null = null;

export function queueDeepLink(target: DeepLinkTarget): void {
  pending = target;
  for (const listener of listeners) {
    listener();
  }
}

export function peekPending(): DeepLinkTarget | null {
  return pending;
}

export function takePending(): DeepLinkTarget | null {
  const target = pending;
  pending = null;
  return target;
}

export function subscribePending(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function openRoute(
  navigation: { navigate: (...args: never[]) => void },
  route: DeepLinkRoute,
): void {
  const nav = navigation as unknown as {
    navigate: (name: string, params?: Record<string, string>) => void;
  };
  nav.navigate(route.name, route.params);
}

export function pickRoute(
  target: DeepLinkTarget,
  routeNames: readonly string[],
): DeepLinkRoute | null {
  if (routeNames.includes(target.primary.name)) {
    return target.primary;
  }
  if (target.alternate && routeNames.includes(target.alternate.name)) {
    return target.alternate;
  }
  return null;
}

function route(name: string, params?: Record<string, string>): DeepLinkTarget {
  return { primary: params ? { name, params } : { name } };
}

export function notificationTarget(
  type: string,
  data: Record<string, string> | null | undefined,
): DeepLinkTarget | null {
  const payload = data ?? {};
  const jobId = payload.jobId;
  const shiftId = payload.shiftId;
  switch (type) {
    case 'job.matched':
    case 'job.favorite_employer':
    case 'job.favorites_only':
    case 'application.accepted':
    case 'application.rejected':
    case 'application.accept_revoked':
    case 'job.closed_with_accepts':
      return jobId ? route('WorkerJobDetail', { jobId }) : null;
    case 'application.received':
    case 'shift.cannot_come':
      return jobId ? route('EmployerApplicants', { jobId }) : null;
    case 'shift.confirm_timeout':
      return jobId
        ? {
            primary: { name: 'EmployerApplicants', params: { jobId } },
            alternate: shiftId
              ? { name: 'WorkerShiftAvailability', params: { shiftId } }
              : undefined,
          }
        : null;
    case 'shift.confirm_3h':
      return shiftId ? route('WorkerShiftAvailability', { shiftId }) : null;
    case 'shift.checkin_due':
      return shiftId ? route('WorkerShiftCheckIn', { shiftId }) : null;
    case 'shift.manual_confirmed':
      return shiftId ? route('WorkerShiftInShift', { shiftId }) : null;
    case 'shift.worker_checked_in':
      return shiftId
        ? route('EmployerShiftManualConfirm', { shiftId })
        : null;
    case 'shift.dispute_update':
      return shiftId
        ? {
            primary: { name: 'WorkerShiftDispute', params: { shiftId } },
            alternate: {
              name: 'EmployerShiftManualConfirm',
              params: { shiftId },
            },
          }
        : null;
    case 'rating.pending':
      return shiftId
        ? route('SharedRatingsCompose', {
            shiftId,
            counterpartLabel: payload.counterpartLabel ?? '—',
          })
        : null;
    case 'job.audience_empty':
      return jobId
        ? route('EmployerJobDetail', { jobId })
        : route('EmployerFavoriteWorkers');
    case 'generic':
      return payload.notificationId
        ? route('SharedNotificationDetail', {
            notificationId: payload.notificationId,
          })
        : null;
    default:
      return null;
  }
}

const APP_PATHS: Array<{
  pattern: RegExp;
  to: (match: RegExpMatchArray) => DeepLinkTarget;
}> = [
  {
    pattern: /^app\/employer\/jobs\/([^/]+)\/applicants$/,
    to: (m) => route('EmployerApplicants', { jobId: m[1] ?? '' }),
  },
  {
    pattern: /^app\/employer\/jobs\/([^/]+)$/,
    to: (m) => route('EmployerJobDetail', { jobId: m[1] ?? '' }),
  },
  {
    pattern: /^app\/employer\/shifts\/([^/]+)\/manual-confirm$/,
    to: (m) => route('EmployerShiftManualConfirm', { shiftId: m[1] ?? '' }),
  },
  {
    pattern: /^app\/employer\/favorites$/,
    to: () => route('EmployerFavoriteWorkers'),
  },
  {
    pattern: /^app\/employer\/disputes$/,
    to: () => route('EmployerOpenDisputes'),
  },
  {
    pattern: /^app\/jobs\/([^/]+)$/,
    to: (m) => route('WorkerJobDetail', { jobId: m[1] ?? '' }),
  },
  {
    pattern: /^app\/shifts\/([^/]+)\/confirm$/,
    to: (m) => route('WorkerShiftAvailability', { shiftId: m[1] ?? '' }),
  },
  {
    pattern: /^app\/shifts\/([^/]+)\/check-in$/,
    to: (m) => route('WorkerShiftCheckIn', { shiftId: m[1] ?? '' }),
  },
  {
    pattern: /^app\/shifts\/([^/]+)\/dispute$/,
    to: (m) => route('WorkerShiftDispute', { shiftId: m[1] ?? '' }),
  },
  {
    pattern: /^app\/shifts\/([^/]+)\/in-shift$/,
    to: (m) => route('WorkerShiftInShift', { shiftId: m[1] ?? '' }),
  },
  {
    pattern: /^app\/ratings\/([^/]+)$/,
    to: (m) =>
      route('SharedRatingsCompose', {
        shiftId: m[1] ?? '',
        counterpartLabel: '—',
      }),
  },
  {
    pattern: /^app\/notifications\/([^/]+)$/,
    to: (m) =>
      route('SharedNotificationDetail', { notificationId: m[1] ?? '' }),
  },
];

export function parseAppPath(path: string): DeepLinkTarget | null {
  const bare = path.replace(/^\//, '').split('?')[0] ?? '';
  for (const entry of APP_PATHS) {
    const match = bare.match(entry.pattern);
    if (match) {
      const target = entry.to(match);
      const id = Object.values(target.primary.params ?? {})[0];
      if (id === '') {
        return null;
      }
      return target;
    }
  }
  return null;
}
