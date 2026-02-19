import type { ScreenContainerProps } from "./types";

export type HabitEditPageHandlers = {
  onSave?: () => void;
  onBack?: () => void;
};

export type HabitEditPageParams = {
  habitId: string;
};

export function SCR004HabitEditPage({
  screenId,
  params,
  handlers,
}: ScreenContainerProps & { params: HabitEditPageParams; handlers?: HabitEditPageHandlers }) {
  return {
    screenId,
    params,
    actions: {
      save: () => handlers?.onSave?.(),
      back: () => handlers?.onBack?.(),
    },
  };
}

