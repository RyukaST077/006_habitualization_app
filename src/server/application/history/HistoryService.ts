import { randomUUID } from "node:crypto";

import { createAppError, isAppError } from "../common/AppError";
import { normalizeTraceId } from "../common/trace-id";
import type { HabitRepositoryContract, UserRepositoryContract } from "../../domain/repositories/contracts";
import { RepositoryDomainError } from "../../domain/repositories/errors";
import type { CalendarCell, CalendarHistory } from "./types";

const HISTORY_REQUIREMENT_ID = "FR-017";
const ANALYTICS_REQUIREMENT_ID = "FR-015";
const YEAR_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DAY_IN_MILLISECONDS = 86_400_000;

function createTraceId(): string {
  return normalizeTraceId(`history-calendar-${randomUUID()}`);
}

function parseDateToUtc(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateDiffInDays(laterDate: string, earlierDate: string): number {
  return Math.floor((parseDateToUtc(laterDate).getTime() - parseDateToUtc(earlierDate).getTime()) / DAY_IN_MILLISECONDS);
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftDate(date: string, amount: number): string {
  const next = parseDateToUtc(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return formatUtcDate(next);
}

function resolveAnalyticsRange(baseDate: string, rangeDays: number): { fromDate: string; toDate: string } {
  return {
    fromDate: shiftDate(baseDate, -(rangeDays - 1)),
    toDate: baseDate,
  };
}

function resolveMonthRange(yearMonth: string): { fromDate: string; toDate: string } {
  const match = YEAR_MONTH_PATTERN.exec(yearMonth);
  if (!match) {
    throw createAppError({
      code: "VALIDATION_ERROR",
      message: "year_month must be yyyy-mm",
      requirementId: HISTORY_REQUIREMENT_ID,
      traceId: createTraceId(),
    });
  }

  const year = Number.parseInt(match[1], 10);
  const monthIndex = Number.parseInt(match[2], 10) - 1;

  const monthStart = new Date(Date.UTC(year, monthIndex, 1));
  const monthEnd = new Date(Date.UTC(year, monthIndex + 1, 0));

  return {
    fromDate: formatUtcDate(monthStart),
    toDate: formatUtcDate(monthEnd),
  };
}

function buildMonthDays(fromDate: string, toDate: string): string[] {
  const start = parseDateToUtc(fromDate);
  const end = parseDateToUtc(toDate);
  const days: string[] = [];

  while (start <= end) {
    days.push(formatUtcDate(start));
    start.setUTCDate(start.getUTCDate() + 1);
  }

  return days;
}

function buildGraceDateSet(checkedDates: string[]): Set<string> {
  const graceDates = new Set<string>();

  for (let index = 1; index < checkedDates.length; index += 1) {
    const previous = checkedDates[index - 1];
    const current = checkedDates[index];

    if (dateDiffInDays(current, previous) === 2) {
      const graceDate = parseDateToUtc(previous);
      graceDate.setUTCDate(graceDate.getUTCDate() + 1);
      graceDates.add(formatUtcDate(graceDate));
    }
  }

  return graceDates;
}

function toCalendarCells(fromDate: string, toDate: string, logs: { logDate: string }[]): CalendarCell[] {
  const monthDays = buildMonthDays(fromDate, toDate);
  const checkedDateSet = new Set(logs.map((log) => log.logDate));
  const checkedDates = Array.from(checkedDateSet).sort((a, b) => a.localeCompare(b));
  const graceDates = buildGraceDateSet(checkedDates);

  return monthDays.map((date) => {
    if (checkedDateSet.has(date)) {
      return { date, status: "checked" };
    }
    if (graceDates.has(date)) {
      return { date, status: "grace" };
    }
    return { date, status: "missed" };
  });
}

function calculateBestStreak(fromDate: string, toDate: string, checkedDates: Set<string>): number {
  let date = fromDate;
  let currentStreak = 0;
  let bestStreak = 0;

  while (date <= toDate) {
    if (checkedDates.has(date)) {
      currentStreak += 1;
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }

    date = shiftDate(date, 1);
  }

  return bestStreak;
}

export interface AnalyticsSummary {
  completionRate: number;
  bestStreak: number;
}

export class HistoryService {
  public constructor(
    private readonly habitRepository: HabitRepositoryContract,
    private readonly userRepository?: UserRepositoryContract,
  ) {}

  public async getCalendarHistory(
    userId: string,
    yearMonth: string,
    includeArchived = false,
    habitId?: string,
  ): Promise<CalendarHistory> {
    const { fromDate, toDate } = resolveMonthRange(yearMonth);

    try {
      const logs = await this.habitRepository.findLogsByDateRange(
        userId,
        fromDate,
        toDate,
        includeArchived,
        habitId,
      );

      return {
        yearMonth,
        fromDate,
        toDate,
        days: toCalendarCells(fromDate, toDate, logs),
      };
    } catch (error: unknown) {
      throw this.mapError(error);
    }
  }

  public async getAnalyticsSummary(
    userId: string,
    rangeDays: number,
    baseDate: string = formatUtcDate(new Date()),
  ): Promise<AnalyticsSummary> {
    if (!this.userRepository) {
      throw createAppError({
        code: "INTERNAL_ERROR",
        message: "analytics repository unavailable",
        requirementId: ANALYTICS_REQUIREMENT_ID,
        traceId: createTraceId(),
      });
    }

    const { fromDate, toDate } = resolveAnalyticsRange(baseDate, rangeDays);

    try {
      const activities = await this.userRepository.findDailyActivitiesByDateRange(userId, fromDate, toDate);
      const checkedDates = new Set(
        activities.filter((activity) => activity.checkinCount > 0).map((activity) => activity.activityDate),
      );

      if (checkedDates.size === 0) {
        return {
          completionRate: 0,
          bestStreak: 0,
        };
      }

      return {
        completionRate: Number(((checkedDates.size / rangeDays) * 100).toFixed(1)),
        bestStreak: calculateBestStreak(fromDate, toDate, checkedDates),
      };
    } catch (error: unknown) {
      throw this.mapError(error, ANALYTICS_REQUIREMENT_ID, "analytics retrieval failed");
    }
  }

  private mapError(error: unknown, requirementId = HISTORY_REQUIREMENT_ID, defaultMessage = "history retrieval failed") {
    if (isAppError(error)) {
      return error;
    }

    if (error instanceof RepositoryDomainError && error.code === "FORBIDDEN") {
      return createAppError({
        code: "FORBIDDEN",
        message: "history access denied",
        requirementId,
        traceId: createTraceId(),
      });
    }

    return createAppError({
      code: "INTERNAL_ERROR",
      message: defaultMessage,
      requirementId,
      traceId: createTraceId(),
    });
  }
}
