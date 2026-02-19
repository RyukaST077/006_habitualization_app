import type { ScreenContainerProps } from "./types";

export type HistoryPageHandlers = {
  onBackHome?: () => void;
};

export function SCR005HistoryPage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: HistoryPageHandlers }) {
  return {
    screenId,
    actions: {
      backHome: () => handlers?.onBackHome?.(),
    },
  };
}

