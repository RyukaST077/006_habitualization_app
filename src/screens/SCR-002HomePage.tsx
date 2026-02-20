import type { ScreenContainerProps } from "./types";
import {
  resolveCommonUiRouteViewModel,
  type CommonUiRouteViewModel,
} from "../app/router";
import type { CommonErrorCode, ErrorPresentation, ErrorStatus } from "../ui/error-presentation";

export type HomePageHandlers = {
  onNavigateTo?: (target: string) => void;
};

const ANALYTICS_ROUTE_PATH = "/analytics";

export type HomePageModel = {
  screenId: ScreenContainerProps["screenId"];
  commonUi: CommonUiRouteViewModel;
  actions: {
    navigateTo: (target: string) => void;
    navigateToAnalytics: () => void;
    resolveError: (status: ErrorStatus, code: CommonErrorCode, traceId?: string) => ErrorPresentation;
  };
};

export function SCR002HomePage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: HomePageHandlers }): HomePageModel {
  const commonUi = resolveCommonUiRouteViewModel("/home");

  return {
    screenId,
    commonUi,
    actions: {
      navigateTo: (target: string) => handlers?.onNavigateTo?.(target),
      navigateToAnalytics: () => handlers?.onNavigateTo?.(ANALYTICS_ROUTE_PATH),
      resolveError: (status, code, traceId) => {
        return resolveCommonUiRouteViewModel("/home", { status, code, traceId }).error;
      },
    },
  };
}
