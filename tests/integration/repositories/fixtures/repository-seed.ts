export interface RepositorySeedProfile {
  userId: string;
  displayName: string;
  timezone: string;
  dayBoundaryHour: number;
  version: number;
  accountStatus: "active" | "disabled";
}

export interface RepositorySeedHabit {
  habitId: string;
  userId: string;
  name: string;
  status: "active" | "archived";
  version: number;
}

export interface RepositorySeedCheckin {
  habitId: string;
  userId: string;
  checkinDate: string;
}

export interface RepositorySeedDailyActivity {
  userId: string;
  activityDate: string;
  checkinCount: number;
}

export interface RepositorySeedBundle {
  profile: RepositorySeedProfile;
  habits: RepositorySeedHabit[];
  checkins: RepositorySeedCheckin[];
  dailyActivities: RepositorySeedDailyActivity[];
}

export function createRepositorySeedBundle(overrides?: Partial<RepositorySeedBundle>): RepositorySeedBundle {
  return {
    profile: {
      userId: "user-red-001",
      displayName: "Red Tester",
      timezone: "Asia/Tokyo",
      dayBoundaryHour: 4,
      version: 1,
      accountStatus: "active",
      ...(overrides?.profile ?? {}),
    },
    habits:
      overrides?.habits ??
      [
        {
          habitId: "habit-red-001",
          userId: "user-red-001",
          name: "walk",
          status: "active",
          version: 1,
        },
      ],
    checkins: overrides?.checkins ?? [],
    dailyActivities: overrides?.dailyActivities ?? [],
  };
}
