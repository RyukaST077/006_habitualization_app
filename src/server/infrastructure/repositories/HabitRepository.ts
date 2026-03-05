import type { HabitCheckinUpsertResult, HabitRepositoryContract } from "../../domain/repositories/contracts";
import { createRepositoryError } from "../../domain/repositories/errors";
import type {
  Habit,
  HabitLog,
  HabitStatus,
  HabitStatusPersistence,
  HabitUpdatePayload,
} from "../../domain/repositories/types";
import {
  assertRepositoryOwnership,
  buildHabitLogKeyForRepository,
  cloneRepositoryValue,
  type SupabaseRepositoryClient,
} from "./supabase-repository-client";

const HABIT_NAME_MIN_LENGTH = 1;
const HABIT_NAME_MAX_LENGTH = 80;
const VALID_HABIT_STATUS = new Set<HabitStatus>(["active", "archived"]);

function createConstraintError(
  message: string,
  constraint: "chk_habits_name_len" | "chk_habits_status",
): ReturnType<typeof createRepositoryError<"INVALID_HABIT_INPUT">> & { constraint: string } {
  const error = createRepositoryError("INVALID_HABIT_INPUT", message) as ReturnType<
    typeof createRepositoryError<"INVALID_HABIT_INPUT">
  > & { constraint: string };
  error.constraint = constraint;
  return error;
}

function assertHabitNameLength(name: string): void {
  if (name.length >= HABIT_NAME_MIN_LENGTH && name.length <= HABIT_NAME_MAX_LENGTH) {
    return;
  }
  throw createConstraintError("chk_habits_name_len violated", "chk_habits_name_len");
}

function assertHabitStatus(status: HabitStatus): void {
  if (VALID_HABIT_STATUS.has(status)) {
    return;
  }
  throw createConstraintError("chk_habits_status violated", "chk_habits_status");
}

function toHabitStatusPersistence(status: HabitStatus, now: string): HabitStatusPersistence {
  return {
    status,
    archived_at: status === "archived" ? now : null,
  };
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
    assertHabitNameLength(name);
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
    assertHabitStatus(status);
    const current = this.client.habits.get(habitId);
    if (current === undefined) {
      throw createRepositoryError("REPOSITORY_ERROR", `habit not found: ${habitId}`);
    }
    assertRepositoryOwnership(current.userId, userId, "RLS policy denied habit update");

    const now = this.client.now();
    const persistence = toHabitStatusPersistence(status, now);

    const updated: Habit = {
      ...current,
      status: persistence.status,
      archivedAt: persistence.archived_at,
      version: current.version + 1,
      updatedAt: now,
    };

    this.client.habits.set(habitId, updated);
    return cloneRepositoryValue({
      ...updated,
      archived_at: persistence.archived_at,
    } as Habit);
  }

  public async upsertCheckin(
    userId: string,
    habitId: string,
    logDate: string,
    checkedInAt: string,
  ): Promise<HabitCheckinUpsertResult> {
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
      if (existing.userId !== userId) {
        throw createRepositoryError("FORBIDDEN", "checkin ownership mismatch");
      }
      return {
        log: cloneRepositoryValue(existing),
        idempotent: true,
      };
    }

    const created: HabitLog = {
      habitId,
      userId,
      logDate,
      checkedInAt,
    };
    this.client.habitLogs.set(key, created);
    return {
      log: cloneRepositoryValue(created),
      idempotent: false,
    };
  }

  public async deleteCheckin(userId: string, habitId: string, logDate: string): Promise<boolean> {
    const habit = this.client.habits.get(habitId);
    if (habit === undefined) {
      return false;
    }
    assertRepositoryOwnership(habit.userId, userId, "habit ownership mismatch");

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
    habitId?: string,
  ): Promise<HabitLog[]> {
    if (fromDate > toDate) {
      return [];
    }

    const targetHabitIds = new Set<string>();
    for (const habit of this.client.habits.values()) {
      if (habit.userId !== userId) {
        continue;
      }
      if (habitId !== undefined && habit.habitId !== habitId) {
        continue;
      }
      if (!includeArchived && habit.status !== "active") {
        continue;
      }
      targetHabitIds.add(habit.habitId);
    }

    if (targetHabitIds.size === 0) {
      return [];
    }

    const logs: HabitLog[] = [];
    for (const log of this.client.habitLogs.values()) {
      if (log.userId !== userId) {
        continue;
      }
      if (!targetHabitIds.has(log.habitId)) {
        continue;
      }
      if (log.logDate < fromDate || log.logDate > toDate) {
        continue;
      }
      logs.push(log);
    }

    logs.sort((a, b) => {
      const dateCmp = a.logDate.localeCompare(b.logDate);
      if (dateCmp !== 0) {
        return dateCmp;
      }
      return a.habitId.localeCompare(b.habitId);
    });
    return logs.map(cloneRepositoryValue);
  }
}
