export type SmokeUserFixture = {
  id: string;
  role: "ROLE-001";
  locale: "ja-JP" | "en-US";
};

export const SMOKE_USERS = {
  primary: {
    id: "USER-A",
    role: "ROLE-001",
    locale: "ja-JP",
  },
} satisfies Record<string, SmokeUserFixture>;
