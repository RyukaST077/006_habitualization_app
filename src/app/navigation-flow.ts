import type { ScreenId } from "../screens/types";

export type NavigationFlowMap = Record<ScreenId, readonly ScreenId[]>;

export const NAVIGATION_FLOW = {
  "SCR-001": ["SCR-008", "SCR-002"],
  "SCR-002": ["SCR-003", "SCR-004", "SCR-005", "SCR-006", "SCR-007"],
  "SCR-003": ["SCR-002"],
  "SCR-004": ["SCR-002"],
  "SCR-005": ["SCR-002"],
  "SCR-006": ["SCR-002"],
  "SCR-007": ["SCR-002", "SCR-001"],
  "SCR-008": ["SCR-001", "SCR-002"],
} as const satisfies NavigationFlowMap;
