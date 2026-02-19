import type { ScreenContainerProps } from "./types";

export type AnalyticsPageHandlers = {
  onBackHome?: () => void;
};

export function SCR006AnalyticsPage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: AnalyticsPageHandlers }) {
  return {
    screenId,
    isOptionalFeature: true as const,
    actions: {
      backHome: () => handlers?.onBackHome?.(),
    },
  };
}

