import type { ScreenContainerProps } from "./types";

export type HabitCreatePageHandlers = {
  onSubmit?: () => void;
  onCancel?: () => void;
};

export type HabitCreatePageModel = {
  screenId: ScreenContainerProps["screenId"];
  ui: {
    validation: {
      name: {
        minLength: 1;
        maxLength: 80;
        error: {
          maxLength: "習慣名は80文字以内で入力してください";
        };
      };
      display_order: {
        min: 1;
        max: 9999;
        error: {
          range: "display_order は1〜9999で入力してください";
        };
      };
    };
  };
  actions: {
    submit: () => void;
    cancel: () => void;
  };
};

export function SCR003HabitCreatePage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: HabitCreatePageHandlers }): HabitCreatePageModel {
  return {
    screenId,
    ui: {
      validation: {
        name: {
          minLength: 1,
          maxLength: 80,
          error: {
            maxLength: "習慣名は80文字以内で入力してください",
          },
        },
        display_order: {
          min: 1,
          max: 9999,
          error: {
            range: "display_order は1〜9999で入力してください",
          },
        },
      },
    },
    actions: {
      submit: () => handlers?.onSubmit?.(),
      cancel: () => handlers?.onCancel?.(),
    },
  };
}
