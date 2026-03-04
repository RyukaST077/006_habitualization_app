import type { ScreenContainerProps } from "./types";
import {
  resolveCommonUiRouteViewModel,
  type CommonUiRouteViewModel,
} from "../app/router";
import {
  resolveErrorPresentation,
  type CommonErrorCode,
  type DomainConflictReason,
  type ErrorPresentation,
  type ErrorStatus,
} from "../ui/error-presentation";

export type HomePageHandlers = {
  onNavigateTo?: (target: string) => void;
  onLoadHabits?: () => Promise<HomeListResolution>;
  onRegisterCheckin?: (input: { habitId: string; logDate: string }) => Promise<CheckinResolution>;
  onCancelCheckin?: (input: { habitId: string; nowUtc: string }) => Promise<CheckinResolution>;
};

const ANALYTICS_ROUTE_PATH = "/analytics";

export type CheckinResolution =
  | {
      kind: "success";
      logDate: string | null;
      idempotent: boolean;
    }
  | {
      kind: "error";
      status: ErrorStatus;
      code: CommonErrorCode;
      traceId?: string;
      domainConflictReason?: DomainConflictReason;
    };

export type CheckinUiResolution = {
  lastCheckinLogDate: string | null;
  error: ErrorPresentation | null;
};

export type HomeHabitSummary = {
  habitId: string;
  name: string;
  status: "active" | "archived";
  streakDays: number;
  lastCheckinLogDate: string | null;
};

export type HomeListResolution =
  | {
      kind: "success";
      habits: HomeHabitSummary[];
    }
  | {
      kind: "error";
      status: ErrorStatus;
      code: CommonErrorCode;
      traceId?: string;
    };

export type HomeListState = "loading" | "loaded" | "error";

export type HomePageModel = {
  screenId: ScreenContainerProps["screenId"];
  commonUi: CommonUiRouteViewModel;
  ui: {
    habits: {
      readonly status: HomeListState;
      readonly items: readonly HomeHabitSummary[];
      readonly error: ErrorPresentation | null;
    };
    checkin: {
      isSubmitting: (habitId: string) => boolean;
    };
    cancelCheckin: {
      readonly isSubmitting: boolean;
    };
  };
  actions: {
    navigateTo: (target: string) => void;
    navigateToAnalytics: () => void;
    resolveError: (status: ErrorStatus, code: CommonErrorCode, traceId?: string) => ErrorPresentation;
    loadHabits: () => Promise<HomeListState>;
    resolveCheckinResult: (result: CheckinResolution) => CheckinUiResolution;
    registerTodayCheckin: (input: { habitId: string; logDate: string }) => Promise<CheckinUiResolution>;
    cancelTodayCheckin: (input: { habitId: string; nowUtc: string }) => Promise<CheckinUiResolution | null>;
  };
};

export function SCR002HomePage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: HomePageHandlers }): HomePageModel {
  const commonUi = resolveCommonUiRouteViewModel("/home");
  let habitsState: HomeListState = "loading";
  let habits: HomeHabitSummary[] = [];
  let habitsError: ErrorPresentation | null = null;
  const checkinSubmittingHabitIds = new Set<string>();
  let cancelCheckinSubmitting = false;

  function resolveCheckinError(result: Extract<CheckinResolution, { kind: "error" }>): ErrorPresentation {
    if (result.status === 409 && result.code === "DOMAIN_CONFLICT" && result.domainConflictReason) {
      return resolveErrorPresentation(result.status, result.code, result.traceId, {
        domainConflictReason: result.domainConflictReason,
      });
    }

    return resolveCommonUiRouteViewModel("/home", {
      status: result.status,
      code: result.code,
      traceId: result.traceId,
    }).error;
  }

  function resolveCheckinUiResult(result: CheckinResolution): CheckinUiResolution {
    if (result.kind === "success") {
      return {
        lastCheckinLogDate: result.logDate,
        error: null,
      };
    }

    return {
      lastCheckinLogDate: null,
      error: resolveCheckinError(result),
    };
  }

  function setHabitCheckinDate(habitId: string, logDate: string | null): string | null {
    const target = habits.find((entry) => entry.habitId === habitId);
    if (!target) {
      return null;
    }
    const previousDate = target.lastCheckinLogDate;
    target.lastCheckinLogDate = logDate;
    return previousDate;
  }

  return {
    screenId,
    commonUi,
    ui: {
      habits: {
        get status() {
          return habitsState;
        },
        get items() {
          return habits;
        },
        get error() {
          return habitsError;
        },
      },
      checkin: {
        isSubmitting: (habitId: string) => checkinSubmittingHabitIds.has(habitId),
      },
      cancelCheckin: {
        get isSubmitting() {
          return cancelCheckinSubmitting;
        },
      },
    },
    actions: {
      navigateTo: (target: string) => handlers?.onNavigateTo?.(target),
      navigateToAnalytics: () => handlers?.onNavigateTo?.(ANALYTICS_ROUTE_PATH),
      resolveError: (status, code, traceId) => {
        return resolveCommonUiRouteViewModel("/home", { status, code, traceId }).error;
      },
      loadHabits: async () => {
        habitsState = "loading";
        habitsError = null;

        try {
          const result = await handlers?.onLoadHabits?.();
          if (!result) {
            habits = [];
            habitsState = "loaded";
            return habitsState;
          }

          if (result.kind === "success") {
            habits = [...result.habits];
            habitsState = "loaded";
            return habitsState;
          }

          habitsState = "error";
          habitsError = resolveCommonUiRouteViewModel("/home", {
            status: result.status,
            code: result.code,
            traceId: result.traceId,
          }).error;
          return habitsState;
        } catch {
          habitsState = "error";
          habitsError = resolveErrorPresentation(500, "INTERNAL_ERROR");
          return habitsState;
        }
      },
      resolveCheckinResult: (result) => resolveCheckinUiResult(result),
      registerTodayCheckin: async ({ habitId, logDate }) => {
        checkinSubmittingHabitIds.add(habitId);
        const previousDate = setHabitCheckinDate(habitId, logDate);

        try {
          const result = await handlers?.onRegisterCheckin?.({ habitId, logDate });
          if (!result) {
            setHabitCheckinDate(habitId, previousDate);
            return {
              lastCheckinLogDate: previousDate,
              error: resolveErrorPresentation(500, "INTERNAL_ERROR"),
            };
          }

          if (result.kind === "success") {
            setHabitCheckinDate(habitId, result.logDate);
            return {
              lastCheckinLogDate: result.logDate,
              error: null,
            };
          }

          setHabitCheckinDate(habitId, previousDate);
          return {
            lastCheckinLogDate: previousDate,
            error: resolveCheckinError(result),
          };
        } catch {
          setHabitCheckinDate(habitId, previousDate);
          return {
            lastCheckinLogDate: previousDate,
            error: resolveErrorPresentation(500, "INTERNAL_ERROR"),
          };
        } finally {
          checkinSubmittingHabitIds.delete(habitId);
        }
      },
      cancelTodayCheckin: async ({ habitId, nowUtc }) => {
        if (cancelCheckinSubmitting) {
          return null;
        }

        cancelCheckinSubmitting = true;
        try {
          const result = await handlers?.onCancelCheckin?.({ habitId, nowUtc });
          if (!result) {
            return {
              lastCheckinLogDate: null,
              error: resolveErrorPresentation(500, "INTERNAL_ERROR"),
            };
          }
          if (result.kind === "success") {
            setHabitCheckinDate(habitId, null);
            return {
              lastCheckinLogDate: null,
              error: null,
            };
          }
          return {
            lastCheckinLogDate: null,
            error: resolveCheckinError(result),
          };
        } catch {
          return {
            lastCheckinLogDate: null,
            error: resolveErrorPresentation(500, "INTERNAL_ERROR"),
          };
        } finally {
          cancelCheckinSubmitting = false;
        }
      },
    },
  };
}
