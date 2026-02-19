export type TestFixtureUser = {
  key: "USER-A" | "USER-B" | "OPS-1";
  role: "ROLE-001" | "ROLE-002";
  timezone: string;
  locale: string;
};

export const TEST_FIXTURE_USERS: Record<string, TestFixtureUser> = {
  USER_A: {
    key: "USER-A",
    role: "ROLE-001",
    timezone: "Asia/Tokyo",
    locale: "ja-JP"
  },
  USER_B: {
    key: "USER-B",
    role: "ROLE-001",
    timezone: "UTC",
    locale: "en-US"
  },
  OPS_1: {
    key: "OPS-1",
    role: "ROLE-002",
    timezone: "Asia/Tokyo",
    locale: "ja-JP"
  }
};
