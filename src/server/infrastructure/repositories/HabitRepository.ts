import type { HabitRepositoryContract } from "../../domain/repositories/contracts";
import { createRepositoryError } from "../../domain/repositories/errors";
import type { Habit, HabitLog, HabitStatus, HabitUpdatePayload } from "../../domain/repositories/types";
import {
  buildForbiddenError,
  buildHabitLogKeyForRepository,
  type SupabaseRepositoryClient,
} from "./supabase-repository-client";

function cloneHabit(habit: Habit): Habit {
  return { ...habit };
}

function cloneLog(log: HabitLog): HabitLog {
  return { ...log };
}

function isInDateRange(value: string, fromDate: string, toDate: string): boolean {
  return value >= fromDate && value <= toDate;
}

export class HabitRepository implements HabitRepositoryContract {
  public constructor(private readonly client: SupabaseRepositoryClient) {}

  public async listHabits(userId: string, status?: HabitStatus): Promise<Habit[]> {
    const habits = [...this.client.habits.values()].filter((habit) => {
      if (habit.userId !== userId) {
        return false;
      }
      if (status === undefined) {
        return true;
      }
      return habit.status === status;
    });

    habits.sort((a, b) => a.displayOrder - b.displayOrder);
    return habits.map(cloneHabit);
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
    return cloneHabit(created);
  }

  public async updateHabit(userId: string, habitId: string, payload: HabitUpdatePayload): Promise<Habit> {
    const current = this.client.habits.get(habitId);
    if (current === undefined) {
      throw createRepositoryError("REPOSITORY_ERROR", `habit not found: ${habitId}`);
    }
    if (current.userId !== userId) {
      throw buildForbiddenError("habit ownership mismatch");
    }
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
    return cloneHabit(updated);
  }

  public async setHabitStatus(userId: string, habitId: string, status: HabitStatus): Promise<Habit> {
    const current = this.client.habits.get(habitId);
    if (current === undefined) {
      throw createRepositoryError("REPOSITORY_ERROR", `habit not found: ${habitId}`);
    }
    if (current.userId !== userId) {
      throw buildForbiddenError("habit ownership mismatch");
    }

    const updated: Habit = {
      ...current,
      status,
      version: current.version + 1,
      updatedAt: this.client.now(),
    };

    this.client.habits.set(habitId, updated);
    return cloneHabit(updated);
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
    if (habit.userId !== userId) {
      throw buildForbiddenError("habit ownership mismatch");
    }
    if (habit.status === "archived") {
      throw createRepositoryError("CHECKIN_CONFLICT", "archived habit does not accept checkin");
    }

    const key = buildHabitLogKeyForRepository(habitId, logDate);
    const existing = this.client.habitLogs.get(key);
    if (existing !== undefined) {
      if (existing.userId === userId && existing.checkedInAt === checkedInAt) {
        return cloneLog(existing);
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
    return cloneLog(created);
  }

  public async deleteCheckin(userId: string, habitId: string, logDate: string): Promise<boolean> {
    const habit = this.client.habits.get(habitId);
    if (habit !== undefined && habit.userId !== userId) {
      throw buildForbiddenError("habit ownership mismatch");
    }

    const key = buildHabitLogKeyForRepository(habitId, logDate);
    const existing = this.client.habitLogs.get(key);
    if (existing === undefined) {
      return false;
    }
    if (existing.userId !== userId) {
      throw buildForbiddenError("checkin ownership mismatch");
    }

    this.client.habitLogs.delete(key);
    return true;
  }

  public async findLogsByDateRange(
    userId: string,
    fromDate: string,
    toDate: string,
    includeArchived: boolean,
  ): Promise<HabitLog[]> {
    const logs = [...this.client.habitLogs.values()].filter((log) => {
      if (log.userId !== userId) {
        return false;
      }
      if (!isInDateRange(log.logDate, fromDate, toDate)) {
        return false;
      }

      if (includeArchived) {
        return true;
      }

      const habit = this.client.habits.get(log.habitId);
      return habit?.status === "active";
    });

    logs.sort((a, b) => a.logDate.localeCompare(b.logDate));
    return logs.map(cloneLog);
  }
}
