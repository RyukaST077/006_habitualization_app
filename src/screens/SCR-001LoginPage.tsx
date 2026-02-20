import type { ScreenContainerProps } from "./types";
import {
  resolveCommonUiRouteViewModel,
  type CommonUiRouteViewModel,
} from "../app/router";
import type { CommonErrorCode, ErrorPresentation, ErrorStatus } from "../ui/error-presentation";

export type LoginPageHandlers = {
  onStartAuth?: () => void;
};

export type LoginPageModel = {
  screenId: ScreenContainerProps["screenId"];
  commonUi: CommonUiRouteViewModel;
  actions: {
    startAuth: () => void;
    resolveError: (status: ErrorStatus, code: CommonErrorCode, traceId?: string) => ErrorPresentation;
  };
};

export function SCR001LoginPage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: LoginPageHandlers }): LoginPageModel {
  const commonUi = resolveCommonUiRouteViewModel("/login");

  return {
    screenId,
    commonUi,
    actions: {
      startAuth: () => handlers?.onStartAuth?.(),
      resolveError: (status, code, traceId) => {
        return resolveCommonUiRouteViewModel("/login", { status, code, traceId }).error;
      },
    },
  };
}
