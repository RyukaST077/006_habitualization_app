import { resolveCommonUiRouteViewModel, type CommonUiRouteViewModel } from "../app/router";
import { resolveErrorPresentation, type CommonErrorCode, type ErrorPresentation, type ErrorStatus } from "../ui/error-presentation";
import type { ScreenContainerProps } from "./types";

export type AnalyticsRangeDays = 7 | 30 | 90;

export type AnalyticsSummaryLoadInput = {
  rangeDays: AnalyticsRangeDays;
};

export type AnalyticsSummaryLoadResolution =
  | {
      kind: "success";
      analytics: {
        completionRate: number;
        bestStreak: number;
      };
    }
  | {
      kind: "error";
      status: ErrorStatus;
      code: CommonErrorCode;
      traceId?: string;
    };

export type AnalyticsCards = {
  completionRate: string;
  bestStreak: string;
};

export type AnalyticsRetryAction = {
  label: "再試行";
  retry: () => Promise<AnalyticsLoadResult>;
};

export type AnalyticsLoadResult =
  | {
      kind: "success";
      input: AnalyticsSummaryLoadInput;
      cards: AnalyticsCards;
    }
  | {
      kind: "error";
      input: AnalyticsSummaryLoadInput;
      error: ErrorPresentation;
      retryAction: AnalyticsRetryAction;
    };

export type AnalyticsPageHandlers = {
  onBackHome?: () => void;
  onLoadSummary?: (input: AnalyticsSummaryLoadInput) => Promise<AnalyticsSummaryLoadResolution>;
};

export type AnalyticsPageModel = {
  screenId: ScreenContainerProps["screenId"];
  isOptionalFeature: true;
  mockLabel: "モック画面";
  unavailableNotice: {
    title: string;
    reason: string;
    fallback: "ホームに戻る";
  };
  commonUi: CommonUiRouteViewModel;
  ui: {
    filters: {
      readonly rangeDays: AnalyticsRangeDays;
      readonly options: readonly AnalyticsRangeDays[];
    };
    cards: {
      readonly completionRate: string;
      readonly bestStreak: string;
    };
    loading: {
      readonly isFetching: boolean;
    };
    error: {
      readonly isVisible: boolean;
      readonly presentation: ErrorPresentation | null;
      readonly retryAction: AnalyticsRetryAction | null;
    };
  };
  actions: {
    isBackHomeEnabled: true;
    backHomeLabel: "ホームに戻る";
    backHome: () => void;
    loadSummary: () => Promise<AnalyticsLoadResult>;
    retryLoad: () => Promise<AnalyticsLoadResult>;
    setRangeDays: (rangeDays: number) => Promise<AnalyticsLoadResult>;
  };
};

const SCR006_RANGE_OPTIONS: readonly AnalyticsRangeDays[] = [7, 30, 90] as const;
const SCR006_DEFAULT_RANGE_DAYS: AnalyticsRangeDays = 30;
const SCR006_UNAVAILABLE_NOTICE = {
  title: "分析機能は準備中です",
  reason: "この機能は現在未実装のため、表示できません。",
  fallback: "ホームに戻る",
} as const;
const SCR006_DEFAULT_CARDS: AnalyticsCards = {
  completionRate: "--%",
  bestStreak: "--日",
};

function normalizeRangeDays(input: number): AnalyticsRangeDays {
  if (input === 7 || input === 30 || input === 90) {
    return input;
  }
  return SCR006_DEFAULT_RANGE_DAYS;
}

function normalizeCompletionRate(value: number): string {
  if (!Number.isFinite(value)) {
    return SCR006_DEFAULT_CARDS.completionRate;
  }
  const normalized = Math.max(0, Math.min(100, Math.round(value)));
  return `${normalized}%`;
}

function normalizeBestStreak(value: number): string {
  if (!Number.isFinite(value)) {
    return SCR006_DEFAULT_CARDS.bestStreak;
  }
  const normalized = Math.max(0, Math.floor(value));
  return `${normalized}日`;
}

function toCards(analytics: { completionRate: number; bestStreak: number }): AnalyticsCards {
  return {
    completionRate: normalizeCompletionRate(analytics.completionRate),
    bestStreak: normalizeBestStreak(analytics.bestStreak),
  };
}

export function SCR006AnalyticsPage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: AnalyticsPageHandlers }): AnalyticsPageModel {
  const commonUi = resolveCommonUiRouteViewModel("/analytics");
  let rangeDays: AnalyticsRangeDays = SCR006_DEFAULT_RANGE_DAYS;
  let cards: AnalyticsCards = { ...SCR006_DEFAULT_CARDS };
  let isFetching = false;
  let errorPresentation: ErrorPresentation | null = null;
  let retryAction: AnalyticsRetryAction | null = null;

  function currentInput(): AnalyticsSummaryLoadInput {
    return { rangeDays };
  }

  async function load(): Promise<AnalyticsLoadResult> {
    const input = currentInput();
    isFetching = true;
    errorPresentation = null;
    retryAction = null;

    try {
      const result = await handlers?.onLoadSummary?.(input);
      if (!result) {
        const fallbackError = resolveErrorPresentation(500, "INTERNAL_ERROR");
        const nextRetryAction: AnalyticsRetryAction = {
          label: "再試行",
          retry: () => load(),
        };
        errorPresentation = fallbackError;
        retryAction = nextRetryAction;
        return {
          kind: "error",
          input,
          error: fallbackError,
          retryAction: nextRetryAction,
        };
      }

      if (result.kind === "success") {
        cards = toCards(result.analytics);
        return {
          kind: "success",
          input,
          cards,
        };
      }

      const mappedError = resolveCommonUiRouteViewModel("/analytics", {
        status: result.status,
        code: result.code,
        traceId: result.traceId,
      }).error;
      const nextRetryAction: AnalyticsRetryAction = {
        label: "再試行",
        retry: () => load(),
      };
      errorPresentation = mappedError;
      retryAction = nextRetryAction;
      return {
        kind: "error",
        input,
        error: mappedError,
        retryAction: nextRetryAction,
      };
    } catch {
      const fallbackError = resolveErrorPresentation(500, "INTERNAL_ERROR");
      const nextRetryAction: AnalyticsRetryAction = {
        label: "再試行",
        retry: () => load(),
      };
      errorPresentation = fallbackError;
      retryAction = nextRetryAction;
      return {
        kind: "error",
        input,
        error: fallbackError,
        retryAction: nextRetryAction,
      };
    } finally {
      isFetching = false;
    }
  }

  return {
    screenId,
    isOptionalFeature: true,
    mockLabel: "モック画面",
    unavailableNotice: SCR006_UNAVAILABLE_NOTICE,
    commonUi,
    ui: {
      filters: {
        get rangeDays() {
          return rangeDays;
        },
        get options() {
          return SCR006_RANGE_OPTIONS;
        },
      },
      cards: {
        get completionRate() {
          return cards.completionRate;
        },
        get bestStreak() {
          return cards.bestStreak;
        },
      },
      loading: {
        get isFetching() {
          return isFetching;
        },
      },
      error: {
        get isVisible() {
          return retryAction !== null;
        },
        get presentation() {
          return errorPresentation;
        },
        get retryAction() {
          return retryAction;
        },
      },
    },
    actions: {
      isBackHomeEnabled: true,
      backHomeLabel: "ホームに戻る",
      backHome: () => handlers?.onBackHome?.(),
      loadSummary: () => load(),
      retryLoad: () => load(),
      setRangeDays: (nextRangeDays) => {
        rangeDays = normalizeRangeDays(nextRangeDays);
        return load();
      },
    },
  };
}
