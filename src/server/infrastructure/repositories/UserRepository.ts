import type { UserRepositoryContract } from "../../domain/repositories/contracts";
import { createRepositoryError } from "../../domain/repositories/errors";
import type { Profile, UserDailyActivity } from "../../domain/repositories/types";
import {
  buildActivityKeyForRepository,
  cloneRepositoryValue,
  type SupabaseRepositoryClient,
} from "./supabase-repository-client";

export class UserRepository implements UserRepositoryContract {
  public constructor(private readonly client: SupabaseRepositoryClient) {}

  public async findProfile(userId: string): Promise<Profile | null> {
    const profile = this.client.profiles.get(userId);
    return profile === undefined ? null : cloneRepositoryValue(profile);
  }

  public async updateProfileSettings(
    userId: string,
    timezone: string,
    cutoff: string,
    version: number,
  ): Promise<Profile> {
    const current = this.client.profiles.get(userId);
    if (current === undefined) {
      throw createRepositoryError("REPOSITORY_ERROR", `profile not found: ${userId}`);
    }

    if (current.version !== version) {
      throw createRepositoryError("OPTIMISTIC_LOCK_CONFLICT", "profile version conflict");
    }

    const updated: Profile = {
      ...current,
      timezone,
      dayCutoffTime: cutoff,
      version: current.version + 1,
    };

    this.client.profiles.set(userId, updated);
    return cloneRepositoryValue(updated);
  }

  public async incrementDailyActivity(
    userId: string,
    logDate: string,
    loginDelta: number,
    checkinDelta: number,
  ): Promise<UserDailyActivity> {
    const key = buildActivityKeyForRepository(userId, logDate);
    const current = this.client.userDailyActivities.get(key);
    const updatedAt = this.client.now();

    if (current === undefined) {
      const created: UserDailyActivity = {
        userId,
        activityDate: logDate,
        loginCount: Math.max(0, loginDelta),
        checkinCount: Math.max(0, checkinDelta),
        updatedAt,
      };
      this.client.userDailyActivities.set(key, created);
      return cloneRepositoryValue(created);
    }

    const updated: UserDailyActivity = {
      ...current,
      loginCount: Math.max(0, current.loginCount + loginDelta),
      checkinCount: Math.max(0, current.checkinCount + checkinDelta),
      updatedAt,
    };
    this.client.userDailyActivities.set(key, updated);
    return cloneRepositoryValue(updated);
  }

  public async markAccountDisabled(userId: string, disabledAt: string): Promise<Profile> {
    void disabledAt;
    const current = this.client.profiles.get(userId);
    if (current === undefined) {
      throw createRepositoryError("REPOSITORY_ERROR", `profile not found: ${userId}`);
    }

    const updated: Profile = {
      ...current,
      accountStatus: "disabled",
      version: current.version + 1,
    };

    this.client.profiles.set(userId, updated);
    return cloneRepositoryValue(updated);
  }
}
