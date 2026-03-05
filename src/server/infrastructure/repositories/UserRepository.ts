import type {
  ProfileSettingsSnapshot,
  UserRepositoryContract,
} from "../../domain/repositories/contracts";
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

  public async getProfileSettings(userId: string): Promise<ProfileSettingsSnapshot | null> {
    const profile = await this.findProfile(userId);
    if (profile === null) {
      return null;
    }

    return {
      timezone: profile.timezone,
      dayCutoffTime: profile.dayCutoffTime,
      version: profile.version,
    };
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

  public async updateProfileSettingsSnapshot(
    userId: string,
    timezone: string,
    cutoff: string,
    version: number,
  ): Promise<ProfileSettingsSnapshot> {
    const updated = await this.updateProfileSettings(userId, timezone, cutoff, version);
    return {
      timezone: updated.timezone,
      dayCutoffTime: updated.dayCutoffTime,
      version: updated.version,
    };
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

  public async findDailyActivitiesByDateRange(
    userId: string,
    fromDate: string,
    toDate: string,
  ): Promise<UserDailyActivity[]> {
    return Array.from(this.client.userDailyActivities.values())
      .filter((activity) => activity.userId === userId && activity.activityDate >= fromDate && activity.activityDate <= toDate)
      .sort((a, b) => a.activityDate.localeCompare(b.activityDate))
      .map((activity) => cloneRepositoryValue(activity));
  }

  public async markAccountDisabled(userId: string, disabledAt: string): Promise<Profile> {
    if (Number.isNaN(Date.parse(disabledAt))) {
      throw createRepositoryError("REPOSITORY_ERROR", "invalid disabledAt");
    }

    const current = this.client.profiles.get(userId);
    if (current === undefined) {
      throw createRepositoryError("REPOSITORY_ERROR", `profile not found: ${userId}`);
    }
    if (current.accountStatus !== "active") {
      throw createRepositoryError("UNIQUE_CONFLICT", "withdrawal already requested");
    }

    const updated: Profile = {
      ...current,
      accountStatus: "disabled",
      version: current.version + 1,
    };

    this.client.profiles.set(userId, updated);
    return cloneRepositoryValue(updated);
  }

  public async hardDeleteAccountData(userId: string, hardDeletedAt: string): Promise<void> {
    if (Number.isNaN(Date.parse(hardDeletedAt))) {
      throw createRepositoryError("REPOSITORY_ERROR", "invalid hardDeletedAt");
    }
    if (!this.client.profiles.has(userId)) {
      throw createRepositoryError("REPOSITORY_ERROR", `profile not found: ${userId}`);
    }

    this.client.profiles.delete(userId);

    for (const [habitId, habit] of this.client.habits.entries()) {
      if (habit.userId === userId) {
        this.client.habits.delete(habitId);
      }
    }

    for (const [key, log] of this.client.habitLogs.entries()) {
      if (log.userId === userId) {
        this.client.habitLogs.delete(key);
      }
    }

    for (const [key, activity] of this.client.userDailyActivities.entries()) {
      if (activity.userId === userId) {
        this.client.userDailyActivities.delete(key);
      }
    }

    for (const [key, consent] of this.client.policyConsents.entries()) {
      if (consent.userId === userId) {
        this.client.policyConsents.delete(key);
      }
    }
  }
}
