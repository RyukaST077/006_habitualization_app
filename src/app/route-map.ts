import type { ScreenId } from "../screens/types";

export type ScreenRouteMap = Record<ScreenId, string>;

export const ROUTE_MAP = {
  "SCR-001": "/login",
  "SCR-002": "/home",
  "SCR-003": "/habits/new",
  "SCR-004": "/habits/:habitId/edit",
  "SCR-005": "/history",
  "SCR-006": "/analytics",
  "SCR-007": "/settings",
  "SCR-008": "/policy-consent",
} as const satisfies ScreenRouteMap;

