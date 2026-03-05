import { randomUUID } from "node:crypto";

import { createAppError, isAppError } from "../common/AppError";
import { normalizeTraceId } from "../common/trace-id";
import type { HabitRepositoryContract } from "../../domain/repositories/contracts";
import { RepositoryDomainError } from "../../domain/repositories/errors";
import type { StreakInfo } from "./types";

const STREAK_REQUIREMENT_ID = "FR-015";

function createTraceId(): string {
  return normalizeTraceId(`streak-calculate-${randomUUID()}`);
}

function parseDateToUtc(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function dayDiff(laterDate: string, earlierDate: string): number {
  const diffMs = parseDateToUtc(laterDate).getTime() - parseDateToUtc(earlierDate).getTime();
  return Math.floor(diffMs / 86_400_000);
}

function buildEmptyStreak(): StreakInfo {
  return {
    current: 0,
    graceUsed: false,
  };
}

export class StreakService {
  public constructor(private readonly habitRepository: HabitRepositoryContract) {}

  public async calculateCurrentStreak(
    userId: string,
    habitId: string,
    baseDate: string,
    traceId: string = createTraceId(),
  ): Promise<StreakInfo> {
    try {
      const habits = await this.habitRepository.listHabits(userId);
      const targetHabit = habits.find((habit) => habit.habitId === habitId);
      if (targetHabit === undefined) {
        throw createAppError({
          code: "DOMAIN_CONFLICT",
          message: "HABIT_NOT_FOUND",
          requirementId: STREAK_REQUIREMENT_ID,
          traceId,
        });
      }

      const allLogs = await this.habitRepository.findLogsByDateRange(userId, "1970-01-01", baseDate, true);
      const uniqueLogDates = Array.from(
        new Set(
          allLogs
            .filter((log) => log.habitId === habitId && log.logDate <= baseDate)
            .map((log) => log.logDate),
        ),
      ).sort((a, b) => b.localeCompare(a));

      if (uniqueLogDates.length === 0) {
        return buildEmptyStreak();
      }

      const latestLogDate = uniqueLogDates[0];
      const baseGap = dayDiff(baseDate, latestLogDate);
      if (baseGap >= 2) {
        return buildEmptyStreak();
      }

      let current = 1;
      let graceUsed = baseGap === 1;
      let previousDate = latestLogDate;

      for (let index = 1; index < uniqueLogDates.length; index += 1) {
        const candidateDate = uniqueLogDates[index];
        const gap = dayDiff(previousDate, candidateDate);
        if (gap <= 0) {
          continue;
        }
        if (gap >= 3) {
          break;
        }

        current += 1;
        if (gap === 2) {
          graceUsed = true;
        }
        previousDate = candidateDate;
      }

      return {
        current,
        graceUsed,
        lastLogDate: latestLogDate,
      };
    } catch (error: unknown) {
      throw this.mapError(error, traceId);
    }
  }

  private mapError(error: unknown, traceId: string) {
    if (isAppError(error)) {
      return error;
    }
    if (error instanceof RepositoryDomainError && error.code === "FORBIDDEN") {
      return createAppError({
        code: "FORBIDDEN",
        message: "streak access denied",
        requirementId: STREAK_REQUIREMENT_ID,
        traceId,
      });
    }
    if (error instanceof RepositoryDomainError && error.code === "REPOSITORY_ERROR") {
      return createAppError({
        code: "DOMAIN_CONFLICT",
        message: "HABIT_NOT_FOUND",
        requirementId: STREAK_REQUIREMENT_ID,
        traceId,
      });
    }

    return createAppError({
      code: "INTERNAL_ERROR",
      message: "streak calculation failed",
      requirementId: STREAK_REQUIREMENT_ID,
      traceId,
    });
  }
}
