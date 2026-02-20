export type TestFixtureUser = {
  key: "USER-A" | "USER-B" | "OPS-1";
  role: "ROLE-001" | "ROLE-002";
  timezone: string;
  locale: string;
};

export {
  buildCommonUiRequiredFooterItems,
  buildCommonUiRequiredHeaderItems,
  COMMON_UI_BREAKPOINT_CASES,
  COMMON_UI_DISPLAY_ITEMS,
  COMMON_UI_ERROR_CASES,
  COMMON_UI_ERROR_RESPONSES,
  COMMON_UI_FOOTER_REQUIRED_ITEMS,
  COMMON_UI_HEADER_REQUIRED_ITEMS,
  COMMON_UI_RESPONSIVE_BREAKPOINTS,
  createCommonUiErrorInput,
} from "./ui/common-ui-fixtures";

export type {
  CommonUiBreakpointKey,
  CommonUiBreakpointWidth,
  CommonUiErrorCase,
  CommonUiErrorCode,
  CommonUiErrorInput,
  CommonUiErrorStatus,
} from "./ui/common-ui-fixtures";

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
