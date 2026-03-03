import type {
  HabitStatus,
  HabitStatusTransition,
  HabitStatusTransitionKind,
  HabitStatusTransitionMap,
} from "../../domain/repositories/types";

// status transition definitions for archive/resume flows in M-003
const STATUS_TRANSITION_MAP: HabitStatusTransitionMap = {
  archive: {
    toStatus: "archived",
    auditAction: "HABIT_ARCHIVE",
    requirementId: "FR-008",
    traceLabel: "archive",
  },
  resume: {
    toStatus: "active",
    auditAction: "HABIT_RESUME",
    requirementId: "FR-009",
    traceLabel: "resume",
  },
};

export function resolveHabitStatusTransition(kind: HabitStatusTransitionKind): HabitStatusTransition {
  return STATUS_TRANSITION_MAP[kind];
}

export function isValidHabitStatusTransition(current: HabitStatus, next: HabitStatus): boolean {
  return (current === "active" && next === "archived") || (current === "archived" && next === "active");
}
