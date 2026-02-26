export type SmokeUserFixture = {
  id: string;
  role: "ROLE-001";
  locale: "ja-JP" | "en-US";
  authScenario: "SUCCESS" | "FAILED" | "DECLINED";
  consented: boolean;
};

export const SMOKE_USERS = {
  primary: {
    id: "user-consented",
    role: "ROLE-001",
    locale: "ja-JP",
    authScenario: "SUCCESS",
    consented: true,
  },
  failed: {
    id: "user-not-consented",
    role: "ROLE-001",
    locale: "ja-JP",
    authScenario: "FAILED",
    consented: false,
  },
  declined: {
    id: "user-declined",
    role: "ROLE-001",
    locale: "ja-JP",
    authScenario: "DECLINED",
    consented: false,
  },
} satisfies Record<string, SmokeUserFixture>;
