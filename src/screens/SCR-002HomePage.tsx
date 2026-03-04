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

export type HomePageModel = {
  screenId: ScreenContainerProps["screenId"];
  commonUi: CommonUiRouteViewModel;
  ui: {
    cancelCheckin: {
      readonly isSubmitting: boolean;
    };
  };
  actions: {
    navigateTo: (target: string) => void;
    navigateToAnalytics: () => void;
    resolveError: (status: ErrorStatus, code: CommonErrorCode, traceId?: string) => ErrorPresentation;
    resolveCheckinResult: (result: CheckinResolution) => CheckinUiResolution;
    cancelTodayCheckin: (input: { habitId: string; nowUtc: string }) => Promise<CheckinUiResolution | null>;
  };
};

export function SCR002HomePage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: HomePageHandlers }): HomePageModel {
  const commonUi = resolveCommonUiRouteViewModel("/home");
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

  return {
    screenId,
    commonUi,
    ui: {
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
      resolveCheckinResult: (result) => resolveCheckinUiResult(result),
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
          return resolveCheckinUiResult(result);
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
