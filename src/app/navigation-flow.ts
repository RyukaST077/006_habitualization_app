import type { ScreenId } from "../screens/types";

export type NavigationFlowMap = Record<ScreenId, readonly ScreenId[]>;

export const AUTH_CONSENT_SCREEN_IDS = ["SCR-001", "SCR-008", "SCR-002"] as const satisfies readonly ScreenId[];
export const BUSINESS_SCREEN_IDS = ["SCR-003", "SCR-004", "SCR-005", "SCR-006", "SCR-007"] as const satisfies readonly ScreenId[];
export const PROTECTED_SCREEN_IDS = ["SCR-002", "SCR-003", "SCR-005", "SCR-006", "SCR-007"] as const satisfies readonly ScreenId[];

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

export function resolveNavigationTargets(screenId: ScreenId): readonly ScreenId[] {
  return NAVIGATION_FLOW[screenId];
}
