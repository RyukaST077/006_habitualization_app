import { resolveCommonUiRouteViewModel, type CommonUiRouteViewModel } from "../app/router";
import type { CommonErrorCode, ErrorStatus } from "../ui/error-presentation";
import type { ScreenContainerProps } from "./types";

export type HistoryCalendarApiCellStatus = "checked" | "missed" | "grace";
export type HistoryCalendarUiCellStatus = "checked" | "unchecked" | "grace" | "empty";

export type HistoryCalendarApiCell = {
  date: string;
  status: HistoryCalendarApiCellStatus;
};

export type HistoryCalendarUiCell = {
  date: string;
  status: HistoryCalendarUiCellStatus;
};

export type HistoryCalendarLoadInput = {
  yearMonth: string;
  habitId: string | null;
  includeArchived: boolean;
};

export type HistoryCalendarLoadResolution =
  | {
      kind: "success";
      days: HistoryCalendarApiCell[];
    }
  | {
      kind: "error";
      status: ErrorStatus;
      code: CommonErrorCode;
      traceId?: string;
    };

export type HistoryRetryAction = {
  label: "再読込";
  retry: () => Promise<HistoryLoadResult>;
};

export type HistoryLoadResult =
  | {
      kind: "success";
      input: HistoryCalendarLoadInput;
      days: readonly HistoryCalendarUiCell[];
    }
  | {
      kind: "error";
      input: HistoryCalendarLoadInput;
      retryAction: HistoryRetryAction;
    };

export type HistoryPageHandlers = {
  onBackHome?: () => void;
  onLoadCalendar?: (input: HistoryCalendarLoadInput) => Promise<HistoryCalendarLoadResolution>;
};

export type HistoryPageModel = {
  screenId: ScreenContainerProps["screenId"];
  commonUi: CommonUiRouteViewModel;
  ui: {
    filters: {
      readonly yearMonth: string;
      readonly habitId: string | null;
      readonly includeArchived: boolean;
    };
    calendar: {
      readonly days: readonly HistoryCalendarUiCell[];
    };
    loading: {
      readonly isFetching: boolean;
    };
    error: {
      readonly isVisible: boolean;
      readonly retryAction: HistoryRetryAction | null;
    };
  };
  actions: {
    backHome: () => void;
    loadCalendar: () => Promise<HistoryLoadResult>;
    retryLoad: () => Promise<HistoryLoadResult>;
    setYearMonth: (yearMonth: string) => Promise<HistoryLoadResult>;
    setHabitFilter: (habitId: string | null) => Promise<HistoryLoadResult>;
    setIncludeArchived: (includeArchived: boolean) => Promise<HistoryLoadResult>;
  };
};

const YYYY_MM_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function resolveDaysInMonth(yearMonth: string): number {
  const [yearText, monthText] = yearMonth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return 30;
  }
  return new Date(year, month, 0).getDate();
}

function buildMonthFrame(yearMonth: string): HistoryCalendarUiCell[] {
  const daysInMonth = resolveDaysInMonth(yearMonth);
  return Array.from({ length: daysInMonth }, (_, index) => ({
    date: `${yearMonth}-${String(index + 1).padStart(2, "0")}`,
    status: "empty" as const,
  }));
}

export function mapHistoryCalendarStatus(status: HistoryCalendarApiCellStatus): Exclude<HistoryCalendarUiCellStatus, "empty"> {
  if (status === "missed") {
    return "unchecked";
  }
  return status;
}

function normalizeYearMonth(input: string, fallback: string): string {
  if (YYYY_MM_PATTERN.test(input)) {
    return input;
  }
  return fallback;
}

export function SCR005HistoryPage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: HistoryPageHandlers }): HistoryPageModel {
  const defaultYearMonth = formatYearMonth(new Date());
  const commonUi = resolveCommonUiRouteViewModel("/history");

  let yearMonth = defaultYearMonth;
  let habitId: string | null = null;
  let includeArchived = false;
  let isFetching = false;
  let calendarDays: HistoryCalendarUiCell[] = buildMonthFrame(yearMonth);
  let retryAction: HistoryRetryAction | null = null;

  function currentInput(): HistoryCalendarLoadInput {
    return {
      yearMonth,
      habitId,
      includeArchived,
    };
  }

  async function load(): Promise<HistoryLoadResult> {
    const input = currentInput();
    isFetching = true;
    retryAction = null;

    try {
      const result = await handlers?.onLoadCalendar?.(input);

      if (!result) {
        calendarDays = buildMonthFrame(input.yearMonth);
        const nextRetryAction: HistoryRetryAction = {
          label: "再読込",
          retry: () => load(),
        };
        retryAction = nextRetryAction;
        return {
          kind: "error",
          input,
          retryAction: nextRetryAction,
        };
      }

      if (result.kind === "success") {
        const mappedByDate = new Map(
          result.days.map((entry) => [entry.date, mapHistoryCalendarStatus(entry.status)] as const),
        );
        calendarDays = buildMonthFrame(input.yearMonth).map((cell) => ({
          ...cell,
          status: mappedByDate.get(cell.date) ?? "empty",
        }));
        return {
          kind: "success",
          input,
          days: calendarDays,
        };
      }

      calendarDays = buildMonthFrame(input.yearMonth);
      const nextRetryAction: HistoryRetryAction = {
        label: "再読込",
        retry: () => load(),
      };
      retryAction = nextRetryAction;
      return {
        kind: "error",
        input,
        retryAction: nextRetryAction,
      };
    } catch {
      calendarDays = buildMonthFrame(input.yearMonth);
      const nextRetryAction: HistoryRetryAction = {
        label: "再読込",
        retry: () => load(),
      };
      retryAction = nextRetryAction;
      return {
        kind: "error",
        input,
        retryAction: nextRetryAction,
      };
    } finally {
      isFetching = false;
    }
  }

  return {
    screenId,
    commonUi,
    ui: {
      filters: {
        get yearMonth() {
          return yearMonth;
        },
        get habitId() {
          return habitId;
        },
        get includeArchived() {
          return includeArchived;
        },
      },
      calendar: {
        get days() {
          return calendarDays;
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
        get retryAction() {
          return retryAction;
        },
      },
    },
    actions: {
      backHome: () => handlers?.onBackHome?.(),
      loadCalendar: () => load(),
      retryLoad: () => load(),
      setYearMonth: (nextYearMonth) => {
        yearMonth = normalizeYearMonth(nextYearMonth, defaultYearMonth);
        return load();
      },
      setHabitFilter: (nextHabitId) => {
        habitId = nextHabitId;
        return load();
      },
      setIncludeArchived: (nextIncludeArchived) => {
        includeArchived = nextIncludeArchived;
        return load();
      },
    },
  };
}
