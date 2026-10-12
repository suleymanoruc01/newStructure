import { istanbulCivil, istanbulInstant, ISTANBUL_TIME_ZONE } from '../common/istanbul-civil.js';
import type { PrismaService } from '../prisma/prisma.service.js';

export const DASHBOARD_TREND_DAYS = 7;

export function istanbulDayKey(at: Date, timeZone = ISTANBUL_TIME_ZONE): string {
  const c = istanbulCivil(at, timeZone);
  const month = String(c.month).padStart(2, '0');
  const day = String(c.day).padStart(2, '0');
  return `${c.year}-${month}-${day}`;
}

export function lastNDayKeys(
  n: number,
  at: Date = new Date(),
  timeZone = ISTANBUL_TIME_ZONE,
): string[] {
  const keys: string[] = [];
  for (let offset = n - 1; offset >= 0; offset -= 1) {
    const civil = istanbulCivil(at, timeZone);
    const anchor = istanbulInstant(
      civil.year,
      civil.month,
      civil.day,
      12,
      0,
      timeZone,
    );
    const shifted = new Date(anchor.getTime() - offset * 86400000);
    keys.push(istanbulDayKey(shifted, timeZone));
  }
  return keys;
}

export function bucketCountsByDay(
  timestamps: Date[],
  dayKeys: string[],
  timeZone = ISTANBUL_TIME_ZONE,
): number[] {
  const counts = new Map(dayKeys.map((key) => [key, 0]));
  for (const at of timestamps) {
    const key = istanbulDayKey(at, timeZone);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return dayKeys.map((key) => counts.get(key) ?? 0);
}

export function sumTokensByDay(
  rows: { amount: number; createdAt: Date }[],
  dayKeys: string[],
  timeZone = ISTANBUL_TIME_ZONE,
): number[] {
  const sums = new Map(dayKeys.map((key) => [key, 0]));
  for (const row of rows) {
    const key = istanbulDayKey(row.createdAt, timeZone);
    if (sums.has(key)) {
      sums.set(key, (sums.get(key) ?? 0) + row.amount);
    }
  }
  return dayKeys.map((key) => sums.get(key) ?? 0);
}

type TopUpRow = {
  amount: number;
  refType: string | null;
  refId: string | null;
};

export function estimateTopUpRevenueTry(
  rows: TopUpRow[],
  packagesById: Map<string, { priceTry: number; tokenCount: number }>,
): number {
  let fallbackPricePerToken: number | null = null;
  if (packagesById.size > 0) {
    let totalPrice = 0;
    let totalTokens = 0;
    for (const pkg of packagesById.values()) {
      if (pkg.tokenCount > 0) {
        totalPrice += pkg.priceTry;
        totalTokens += pkg.tokenCount;
      }
    }
    fallbackPricePerToken =
      totalTokens > 0 ? Math.round(totalPrice / totalTokens) : null;
  }

  let revenue = 0;
  for (const row of rows) {
    if (row.refType === 'token_package' && row.refId) {
      const pkg = packagesById.get(row.refId);
      if (pkg) {
        revenue += pkg.priceTry;
        continue;
      }
    }
    if (fallbackPricePerToken !== null && row.amount > 0) {
      revenue += row.amount * fallbackPricePerToken;
    }
  }
  return revenue;
}

export async function loadDashboardAnalytics(prisma: PrismaService) {
  const now = new Date();
  const civil = istanbulCivil(now);
  const startOfToday = istanbulInstant(civil.year, civil.month, civil.day, 0, 0);
  const startOfMonth = istanbulInstant(civil.year, civil.month, 1, 0, 0);
  const trendSince = new Date(
    startOfToday.getTime() - (DASHBOARD_TREND_DAYS - 1) * 86400000,
  );
  const dayKeys = lastNDayKeys(DASHBOARD_TREND_DAYS, now);

  const [
    totalUsers,
    totalEmployers,
    publishedJobs,
    totalApplications,
    acceptedApplications,
    completedShifts,
    topUpTodayAgg,
    topUpMonthRows,
    newUserRows,
    applicationRows,
    topUpTrendRows,
    tokenPackages,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.employer.count(),
    prisma.job.count({ where: { status: 'published' } }),
    prisma.application.count(),
    prisma.application.count({ where: { status: 'accepted' } }),
    prisma.shift.count({ where: { status: 'completed' } }),
    prisma.tokenLedgerEntry.aggregate({
      where: { type: 'top_up', createdAt: { gte: startOfToday } },
      _sum: { amount: true },
    }),
    prisma.tokenLedgerEntry.findMany({
      where: { type: 'top_up', createdAt: { gte: startOfMonth } },
      select: { amount: true, refType: true, refId: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: trendSince } },
      select: { createdAt: true },
    }),
    prisma.application.findMany({
      where: { createdAt: { gte: trendSince } },
      select: { createdAt: true },
    }),
    prisma.tokenLedgerEntry.findMany({
      where: { type: 'top_up', createdAt: { gte: trendSince } },
      select: { amount: true, createdAt: true },
    }),
    prisma.tokenPackage.findMany({
      select: { id: true, priceTry: true, tokenCount: true },
    }),
  ]);

  const packagesById = new Map(
    tokenPackages.map((pkg) => [
      pkg.id,
      { priceTry: pkg.priceTry, tokenCount: pkg.tokenCount },
    ]),
  );

  return {
    business: {
      totalUsers,
      totalEmployers,
      publishedJobs,
      totalApplications,
      acceptedApplications,
      completedShifts,
      topUpTokensToday: topUpTodayAgg._sum.amount ?? 0,
      estimatedRevenueTryMonth: estimateTopUpRevenueTry(
        topUpMonthRows,
        packagesById,
      ),
    },
    trends: {
      dayKeys,
      newUsersByDay: bucketCountsByDay(
        newUserRows.map((row) => row.createdAt),
        dayKeys,
      ),
      applicationsByDay: bucketCountsByDay(
        applicationRows.map((row) => row.createdAt),
        dayKeys,
      ),
      topUpTokensByDay: sumTokensByDay(topUpTrendRows, dayKeys),
    },
  };
}
