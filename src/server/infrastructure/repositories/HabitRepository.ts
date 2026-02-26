import type { HabitRepositoryContract } from "../../domain/repositories/contracts";
import { createRepositoryError } from "../../domain/repositories/errors";
import type { Habit, HabitLog, HabitStatus, HabitUpdatePayload } from "../../domain/repositories/types";
import {
  assertRepositoryOwnership,
  buildHabitLogKeyForRepository,
  cloneRepositoryValue,
  type SupabaseRepositoryClient,
} from "./supabase-repository-client";

function listDateRange(fromDate: string, toDate: string): string[] {
  if (fromDate > toDate) {
    return [];
  }

  const current = new Date(`${fromDate}T00:00:00.000Z`);
  const end = new Date(`${toDate}T00:00:00.000Z`);
  if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime())) {
    return [];
  }

  const dates: string[] = [];
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export class HabitRepository implements HabitRepositoryContract {
  public constructor(private readonly client: SupabaseRepositoryClient) {}

  public async listHabits(userId: string, status?: HabitStatus): Promise<Habit[]> {
    const habits: Habit[] = [];
    for (const habit of this.client.habits.values()) {
      if (habit.userId !== userId) {
        continue;
      }
      if (status === undefined) {
        habits.push(habit);
        continue;
      }
      if (habit.status === status) {
        habits.push(habit);
      }
    }

    habits.sort((a, b) => a.displayOrder - b.displayOrder);
    return habits.map(cloneRepositoryValue);
  }

  public async createHabit(userId: string, name: string, displayOrder: number): Promise<Habit> {
    const now = this.client.now();
    const created: Habit = {
      habitId: this.client.nextHabitId(),
      userId,
      name,
      note: null,
      displayOrder,
      status: "active",
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.client.habits.set(created.habitId, created);
    return cloneRepositoryValue(created);
  }

  public async updateHabit(userId: string, habitId: string, payload: HabitUpdatePayload): Promise<Habit> {
    const current = this.client.habits.get(habitId);
    if (current === undefined) {
      throw createRepositoryError("REPOSITORY_ERROR", `habit not found: ${habitId}`);
    }
    assertRepositoryOwnership(current.userId, userId, "habit ownership mismatch");
    if (current.version !== payload.version) {
      throw createRepositoryError("OPTIMISTIC_LOCK_CONFLICT", "habit version conflict");
    }

    const updated: Habit = {
      ...current,
      name: payload.name ?? current.name,
      note: payload.note !== undefined ? payload.note : current.note,
      displayOrder: payload.displayOrder ?? current.displayOrder,
      version: current.version + 1,
      updatedAt: this.client.now(),
    };

    this.client.habits.set(habitId, updated);
    return cloneRepositoryValue(updated);
  }

  public async setHabitStatus(userId: string, habitId: string, status: HabitStatus): Promise<Habit> {
    const current = this.client.habits.get(habitId);
    if (current === undefined) {
      throw createRepositoryError("REPOSITORY_ERROR", `habit not found: ${habitId}`);
    }
    assertRepositoryOwnership(current.userId, userId, "habit ownership mismatch");

    const updated: Habit = {
      ...current,
      status,
      version: current.version + 1,
      updatedAt: this.client.now(),
    };

    this.client.habits.set(habitId, updated);
    return cloneRepositoryValue(updated);
  }

  public async upsertCheckin(
    userId: string,
    habitId: string,
    logDate: string,
    checkedInAt: string,
  ): Promise<HabitLog> {
    const habit = this.client.habits.get(habitId);
    if (habit === undefined) {
      throw createRepositoryError("REPOSITORY_ERROR", `habit not found: ${habitId}`);
    }
    assertRepositoryOwnership(habit.userId, userId, "habit ownership mismatch");
    if (habit.status === "archived") {
      throw createRepositoryError("CHECKIN_CONFLICT", "archived habit does not accept checkin");
    }

    const key = buildHabitLogKeyForRepository(habitId, logDate);
    const existing = this.client.habitLogs.get(key);
    if (existing !== undefined) {
      if (existing.userId === userId && existing.checkedInAt === checkedInAt) {
        return cloneRepositoryValue(existing);
      }
      throw createRepositoryError("CHECKIN_CONFLICT", "duplicate habit/date checkin");
    }

    const created: HabitLog = {
      habitId,
      userId,
      logDate,
      checkedInAt,
    };
    this.client.habitLogs.set(key, created);
    return cloneRepositoryValue(created);
  }

  public async deleteCheckin(userId: string, habitId: string, logDate: string): Promise<boolean> {
    const habit = this.client.habits.get(habitId);
    if (habit !== undefined) {
      assertRepositoryOwnership(habit.userId, userId, "habit ownership mismatch");
    }

    const key = buildHabitLogKeyForRepository(habitId, logDate);
    const existing = this.client.habitLogs.get(key);
    if (existing === undefined) {
      return false;
    }
    assertRepositoryOwnership(existing.userId, userId, "checkin ownership mismatch");

    this.client.habitLogs.delete(key);
    return true;
  }

  public async findLogsByDateRange(
    userId: string,
    fromDate: string,
    toDate: string,
    includeArchived: boolean,
  ): Promise<HabitLog[]> {
    const targetDates = listDateRange(fromDate, toDate);
    if (targetDates.length === 0) {
      return [];
    }

    const targetHabitIds: string[] = [];
    for (const habit of this.client.habits.values()) {
      if (habit.userId !== userId) {
        continue;
      }
      if (!includeArchived && habit.status !== "active") {
        continue;
      }
      targetHabitIds.push(habit.habitId);
    }

    const logs: HabitLog[] = [];
    for (const habitId of targetHabitIds) {
      for (const logDate of targetDates) {
        const log = this.client.habitLogs.get(buildHabitLogKeyForRepository(habitId, logDate));
        if (log === undefined) {
          continue;
        }
        if (log.userId !== userId) {
          continue;
        }
        logs.push(log);
      }
    }

    logs.sort((a, b) => a.logDate.localeCompare(b.logDate));
    return logs.map(cloneRepositoryValue);
  }
}
