import type { ScreenContainerProps } from "./types";

export type LoginPageHandlers = {
  onStartAuth?: () => void;
};

export function SCR001LoginPage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: LoginPageHandlers }) {
  return {
    screenId,
    actions: {
      startAuth: () => handlers?.onStartAuth?.(),
    },
  };
}

