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

const DEFAULT_PROFILE: RepositorySeedProfile = {
  userId: "user-red-001",
  displayName: "Red Tester",
  timezone: "Asia/Tokyo",
  dayBoundaryHour: 4,
  version: 1,
  accountStatus: "active",
};

const DEFAULT_HABITS: RepositorySeedHabit[] = [
  {
    habitId: "habit-red-001",
    userId: "user-red-001",
    name: "walk",
    status: "active",
    version: 1,
  },
];

const EMPTY_CHECKINS: RepositorySeedCheckin[] = [];
const EMPTY_DAILY_ACTIVITIES: RepositorySeedDailyActivity[] = [];

export function createRepositorySeedBundle(overrides?: Partial<RepositorySeedBundle>): RepositorySeedBundle {
  return {
    profile: {
      ...DEFAULT_PROFILE,
      ...(overrides?.profile ?? {}),
    },
    habits: overrides?.habits ?? DEFAULT_HABITS,
    checkins: overrides?.checkins ?? EMPTY_CHECKINS,
    dailyActivities: overrides?.dailyActivities ?? EMPTY_DAILY_ACTIVITIES,
  };
}
