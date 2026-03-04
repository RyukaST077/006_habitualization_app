import type { ScreenContainerProps } from "./types";
import {
  resolveCommonUiRouteViewModel,
  type CommonUiRouteViewModel,
} from "../app/router";
import type { CommonErrorCode, ErrorPresentation, ErrorStatus } from "../ui/error-presentation";

export type LoginPageHandlers = {
  onStartAuth?: () => void | Promise<void>;
  onRetryAuth?: () => void | Promise<void>;
};

export type LoginPageModel = {
  screenId: ScreenContainerProps["screenId"];
  commonUi: CommonUiRouteViewModel;
  ui: {
    loginButton: {
      label: "Googleでログイン";
      ariaLabel: "Googleでログイン";
      executeKey: "Enter";
      readonly loading: boolean;
      readonly disabled: boolean;
    };
  };
  actions: {
    startAuth: () => Promise<void>;
    retryAuth: () => Promise<void>;
    handleLoginButtonKeyDown: (key: string) => boolean;
    resolveError: (status: ErrorStatus, code: CommonErrorCode, traceId?: string) => ErrorPresentation;
  };
};

export function SCR001LoginPage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: LoginPageHandlers }): LoginPageModel {
  const commonUi = resolveCommonUiRouteViewModel("/login");
  let isSubmitting = false;

  async function runAuthAction(action: (() => void | Promise<void>) | undefined): Promise<void> {
    if (isSubmitting) {
      return;
    }
    isSubmitting = true;
    try {
      await action?.();
    } finally {
      isSubmitting = false;
    }
  }

  return {
    screenId,
    commonUi,
    ui: {
      loginButton: {
        label: "Googleでログイン",
        ariaLabel: "Googleでログイン",
        executeKey: "Enter",
        get loading() {
          return isSubmitting;
        },
        get disabled() {
          return isSubmitting;
        },
      },
    },
    actions: {
      startAuth: () => {
        return runAuthAction(handlers?.onStartAuth);
      },
      retryAuth: () => {
        const retryAction = handlers?.onRetryAuth ?? handlers?.onStartAuth;
        return runAuthAction(retryAction);
      },
      handleLoginButtonKeyDown: (key: string) => {
        if (key !== "Enter") {
          return false;
        }
        if (isSubmitting) {
          return false;
        }
        void runAuthAction(handlers?.onStartAuth);
        return true;
      },
      resolveError: (status, code, traceId) => {
        return resolveCommonUiRouteViewModel("/login", { status, code, traceId }).error;
      },
    },
  };
}
