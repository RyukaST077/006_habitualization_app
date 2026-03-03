export const SCREEN_IDS = [
  "SCR-001",
  "SCR-002",
  "SCR-003",
  "SCR-004",
  "SCR-005",
  "SCR-006",
  "SCR-007",
  "SCR-008",
] as const;

export type ScreenId = (typeof SCREEN_IDS)[number];

export type HabitLifecycleStatus = "active" | "archived";

export type ScreenContainerProps = {
  screenId: ScreenId;
};
