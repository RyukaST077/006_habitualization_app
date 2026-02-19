import type { ScreenContainerProps } from "./types";

export type HomePageHandlers = {
  onNavigateTo?: (target: string) => void;
};

export function SCR002HomePage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: HomePageHandlers }) {
  return {
    screenId,
    actions: {
      navigateTo: (target: string) => handlers?.onNavigateTo?.(target),
    },
  };
}

