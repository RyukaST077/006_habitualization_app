import { resolveCommonUiRouteViewModel, type CommonUiRouteViewModel } from "../app/router";
import { resolveErrorPresentation, type CommonErrorCode, type ErrorPresentation, type ErrorStatus } from "../ui/error-presentation";
import type { ScreenContainerProps } from "./types";

export type SettingsProfile = {
  timezone: string;
  dayCutoffTime: string;
};

export type SettingsSaveResolution =
  | {
      kind: "success";
      profile: SettingsProfile;
    }
  | {
      kind: "error";
      status: ErrorStatus;
      code: CommonErrorCode;
      traceId?: string;
    };

export type SettingsWithdrawalResolution =
  | {
      kind: "success";
    }
  | {
      kind: "error";
      status: ErrorStatus;
      code: CommonErrorCode;
      traceId?: string;
    };

export type SettingsLogoutResolution =
  | {
      kind: "success";
      route: "SCR-001" | "SCR-002" | "SCR-008";
    }
  | {
      kind: "error";
      status: ErrorStatus;
      code: CommonErrorCode;
      traceId?: string;
    };

export type SettingsRetryAction = {
  label: "再試行";
  retry: () => Promise<SettingsSaveResult>;
};

export type SettingsSaveResult =
  | {
      kind: "success";
      profile: SettingsProfile;
    }
  | {
      kind: "error";
      error: ErrorPresentation;
      retryAction: SettingsRetryAction;
    };

export type SettingsWithdrawalConfirmStep = 0 | 1 | 2;

export type SettingsPageHandlers = {
  onBackHome?: () => void;
  onLogout?: () => Promise<SettingsLogoutResolution>;
  onSaveSettings?: (input: SettingsProfile) => Promise<SettingsSaveResolution>;
  onWithdraw?: () => Promise<SettingsWithdrawalResolution>;
};

export type SettingsPageModel = {
  screenId: ScreenContainerProps["screenId"];
  commonUi: CommonUiRouteViewModel;
  ui: {
    form: {
      readonly timezone: string;
      readonly dayCutoffTime: string;
      readonly timezoneOptions: readonly string[];
      readonly errors: {
        readonly timezone: string | null;
        readonly dayCutoffTime: string | null;
      };
    };
    save: {
      readonly isDirty: boolean;
      readonly isEnabled: boolean;
      readonly isSubmitting: boolean;
    };
    error: {
      readonly isVisible: boolean;
      readonly presentation: ErrorPresentation | null;
      readonly retryAction: SettingsRetryAction | null;
    };
    withdrawal: {
      readonly isModalOpen: boolean;
      readonly confirmStep: SettingsWithdrawalConfirmStep;
      readonly isSubmitting: boolean;
    };
  };
  actions: {
    backHome: () => void;
    logout: () => Promise<SettingsLogoutResolution>;
    setTimezone: (timezone: string) => void;
    setDayCutoffTime: (dayCutoffTime: string) => void;
    save: () => Promise<SettingsSaveResult>;
    retrySave: () => Promise<SettingsSaveResult>;
    openWithdrawalModal: () => void;
    advanceWithdrawalConfirmStep: () => void;
    cancelWithdrawalModal: () => void;
    executeWithdrawal: () => Promise<SettingsWithdrawalResolution>;
  };
};

const HH_MM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DEFAULT_TIMEZONE_OPTIONS = ["Asia/Tokyo", "UTC", "America/Los_Angeles"] as const;
const DEFAULT_PROFILE: SettingsProfile = {
  timezone: "Asia/Tokyo",
  dayCutoffTime: "00:00",
};

function validateTimezone(timezone: string, timezoneOptions: readonly string[]): string | null {
  if (timezoneOptions.includes(timezone)) {
    return null;
  }
  return "IANAタイムゾーンを選択してください";
}

function validateDayCutoffTime(dayCutoffTime: string): string | null {
  if (HH_MM_PATTERN.test(dayCutoffTime)) {
    return null;
  }
  return "締め時刻は HH:mm（00:00〜23:59）で入力してください";
}

function mapSettingsError(
  status: ErrorStatus,
  code: CommonErrorCode,
  traceId?: string,
): ErrorPresentation {
  return resolveErrorPresentation(status, code, traceId);
}

export function SCR007SettingsPage({
  screenId,
  handlers,
  initialProfile,
  timezoneOptions = DEFAULT_TIMEZONE_OPTIONS,
}: ScreenContainerProps & {
  handlers?: SettingsPageHandlers;
  initialProfile?: SettingsProfile;
  timezoneOptions?: readonly string[];
}): SettingsPageModel {
  const commonUi = resolveCommonUiRouteViewModel("/settings");

  let originalProfile: SettingsProfile = { ...(initialProfile ?? DEFAULT_PROFILE) };
  let editingProfile: SettingsProfile = { ...originalProfile };
  let timezoneError: string | null = null;
  let dayCutoffTimeError: string | null = null;
  let isSaving = false;
  let saveError: ErrorPresentation | null = null;
  let saveRetryAction: SettingsRetryAction | null = null;
  let withdrawalModalOpen = false;
  let withdrawalConfirmStep: SettingsWithdrawalConfirmStep = 0;
  let isWithdrawing = false;
  let inFlightSave: Promise<SettingsSaveResult> | null = null;

  function isDirty(): boolean {
    return (
      editingProfile.timezone !== originalProfile.timezone ||
      editingProfile.dayCutoffTime !== originalProfile.dayCutoffTime
    );
  }

  function revalidate(): void {
    timezoneError = validateTimezone(editingProfile.timezone, timezoneOptions);
    dayCutoffTimeError = validateDayCutoffTime(editingProfile.dayCutoffTime);
  }

  function canSave(): boolean {
    return isDirty() && !isSaving && timezoneError === null && dayCutoffTimeError === null;
  }

  async function save(): Promise<SettingsSaveResult> {
    if (inFlightSave) {
      return inFlightSave;
    }

    revalidate();
    if (!canSave()) {
      const fallbackError = mapSettingsError(400, "VALIDATION_ERROR");
      const retryAction: SettingsRetryAction = {
        label: "再試行",
        retry: () => save(),
      };
      saveError = fallbackError;
      saveRetryAction = retryAction;
      return {
        kind: "error",
        error: fallbackError,
        retryAction,
      };
    }

    const execute = async (): Promise<SettingsSaveResult> => {
      isSaving = true;
      saveError = null;
      saveRetryAction = null;
      try {
        const result = await handlers?.onSaveSettings?.(editingProfile);
        if (!result) {
          const fallbackError = mapSettingsError(500, "INTERNAL_ERROR");
          const retryAction: SettingsRetryAction = {
            label: "再試行",
            retry: () => save(),
          };
          saveError = fallbackError;
          saveRetryAction = retryAction;
          return {
            kind: "error",
            error: fallbackError,
            retryAction,
          };
        }

        if (result.kind === "success") {
          originalProfile = { ...result.profile };
          editingProfile = { ...result.profile };
          revalidate();
          return {
            kind: "success",
            profile: result.profile,
          };
        }

        const mappedError = mapSettingsError(result.status, result.code, result.traceId);
        const retryAction: SettingsRetryAction = {
          label: "再試行",
          retry: () => save(),
        };
        saveError = mappedError;
        saveRetryAction = retryAction;
        return {
          kind: "error",
          error: mappedError,
          retryAction,
        };
      } catch {
        const fallbackError = mapSettingsError(500, "INTERNAL_ERROR");
        const retryAction: SettingsRetryAction = {
          label: "再試行",
          retry: () => save(),
        };
        saveError = fallbackError;
        saveRetryAction = retryAction;
        return {
          kind: "error",
          error: fallbackError,
          retryAction,
        };
      } finally {
        isSaving = false;
        inFlightSave = null;
      }
    };

    inFlightSave = execute();
    return inFlightSave;
  }

  async function executeWithdrawal(): Promise<SettingsWithdrawalResolution> {
    if (isWithdrawing || !withdrawalModalOpen || withdrawalConfirmStep !== 2) {
      return {
        kind: "error",
        status: 400,
        code: "VALIDATION_ERROR",
      };
    }
    isWithdrawing = true;
    try {
      const result = await handlers?.onWithdraw?.();
      if (!result) {
        return {
          kind: "error",
          status: 500,
          code: "INTERNAL_ERROR",
        };
      }

      if (result.kind === "success") {
        withdrawalModalOpen = false;
        withdrawalConfirmStep = 0;
      }
      return result;
    } catch {
      return {
        kind: "error",
        status: 500,
        code: "INTERNAL_ERROR",
      };
    } finally {
      isWithdrawing = false;
    }
  }

  revalidate();

  return {
    screenId,
    commonUi,
    ui: {
      form: {
        get timezone() {
          return editingProfile.timezone;
        },
        get dayCutoffTime() {
          return editingProfile.dayCutoffTime;
        },
        get timezoneOptions() {
          return timezoneOptions;
        },
        errors: {
          get timezone() {
            return timezoneError;
          },
          get dayCutoffTime() {
            return dayCutoffTimeError;
          },
        },
      },
      save: {
        get isDirty() {
          return isDirty();
        },
        get isEnabled() {
          return canSave();
        },
        get isSubmitting() {
          return isSaving;
        },
      },
      error: {
        get isVisible() {
          return saveRetryAction !== null;
        },
        get presentation() {
          return saveError;
        },
        get retryAction() {
          return saveRetryAction;
        },
      },
      withdrawal: {
        get isModalOpen() {
          return withdrawalModalOpen;
        },
        get confirmStep() {
          return withdrawalConfirmStep;
        },
        get isSubmitting() {
          return isWithdrawing;
        },
      },
    },
    actions: {
      backHome: () => handlers?.onBackHome?.(),
      logout: async () => {
        const result = await handlers?.onLogout?.();
        if (result) {
          return result;
        }
        return {
          kind: "error",
          status: 500,
          code: "INTERNAL_ERROR",
        };
      },
      setTimezone: (nextTimezone) => {
        editingProfile = { ...editingProfile, timezone: nextTimezone };
        revalidate();
      },
      setDayCutoffTime: (nextDayCutoffTime) => {
        editingProfile = { ...editingProfile, dayCutoffTime: nextDayCutoffTime };
        revalidate();
      },
      save: () => save(),
      retrySave: () => save(),
      openWithdrawalModal: () => {
        withdrawalModalOpen = true;
        withdrawalConfirmStep = 1;
      },
      advanceWithdrawalConfirmStep: () => {
        if (!withdrawalModalOpen) {
          return;
        }
        withdrawalConfirmStep = withdrawalConfirmStep === 1 ? 2 : 2;
      },
      cancelWithdrawalModal: () => {
        withdrawalModalOpen = false;
        withdrawalConfirmStep = 0;
      },
      executeWithdrawal: () => executeWithdrawal(),
    },
  };
}
