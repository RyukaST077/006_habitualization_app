import { HabitRepository } from "../../../../src/server/infrastructure/repositories/HabitRepository";
import {
  type SupabaseRepositoryClient,
  createSupabaseRepositoryClient,
} from "../../../../src/server/infrastructure/repositories/supabase-repository-client";
import { createRepositorySeedBundle } from "../fixtures/repository-seed";

export interface RepositoryTestHarness {
  setup(): Promise<void>;
  cleanup(): Promise<void>;
}

export interface HabitRepositoryFixture {
  repository: HabitRepository;
  client: SupabaseRepositoryClient;
  userId: string;
  otherUserId: string;
  habitId: string;
}

export interface HabitRecordSnapshot {
  habitId: string;
  userId: string;
  name: string;
  note: string | null;
  displayOrder: number;
  status: "active" | "archived";
  version: number;
  updatedAt: string;
}

export function createRepositoryTestHarness(): RepositoryTestHarness {
  return {
    async setup(): Promise<void> {
      // TODO(T-025): 実DB接続/seed処理を追加する
    },
    async cleanup(): Promise<void> {
      // TODO(T-025): トランザクションロールバック/データ後始末を追加する
    },
  };
}

export function createHabitRepositoryFixture(): HabitRepositoryFixture {
  const seed = createRepositorySeedBundle();
  const now = new Date().toISOString();
  const client = createSupabaseRepositoryClient({
    habits: seed.habits.map((habit, index) => ({
      habitId: habit.habitId,
      userId: habit.userId,
      name: habit.name,
      note: null,
      displayOrder: (index + 1) * 10,
      status: habit.status,
      version: habit.version,
      createdAt: now,
      updatedAt: now,
    })),
    habitLogs: seed.checkins.map((checkin) => ({
      habitId: checkin.habitId,
      userId: checkin.userId,
      logDate: checkin.checkinDate,
      checkedInAt: now,
    })),
  });

  return {
    repository: new HabitRepository(client),
    client,
    userId: seed.profile.userId,
    otherUserId: "user-red-002",
    habitId: seed.habits[0]!.habitId,
  };
}

export function snapshotHabitRecord(client: SupabaseRepositoryClient, habitId: string): HabitRecordSnapshot {
  const habit = client.habits.get(habitId);
  if (habit === undefined) {
    throw new Error(`habit not found: ${habitId}`);
  }
  return {
    habitId: habit.habitId,
    userId: habit.userId,
    name: habit.name,
    note: habit.note,
    displayOrder: habit.displayOrder,
    status: habit.status,
    version: habit.version,
    updatedAt: habit.updatedAt,
  };
}
