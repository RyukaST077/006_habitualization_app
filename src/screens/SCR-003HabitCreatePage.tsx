import type { ScreenContainerProps } from "./types";

export type HabitCreatePageHandlers = {
  onSubmit?: () => void;
  onCancel?: () => void;
};

export function SCR003HabitCreatePage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: HabitCreatePageHandlers }) {
  return {
    screenId,
    actions: {
      submit: () => handlers?.onSubmit?.(),
      cancel: () => handlers?.onCancel?.(),
    },
  };
}

