import type { ScreenContainerProps } from "./types";

export type HabitCreatePageHandlers = {
  onSubmit?: () => void | Promise<void>;
  onCancel?: () => void;
};

export type HabitCreatePageModel = {
  screenId: ScreenContainerProps["screenId"];
  ui: {
    form: {
      readonly name: string;
      readonly display_order: number;
    };
    errors: {
      readonly name: string | null;
      readonly display_order: string | null;
    };
    saveButton: {
      label: "保存";
      readonly loading: boolean;
      readonly disabled: boolean;
    };
    readonly isSaving: boolean;
    validation: {
      name: {
        minLength: 1;
        maxLength: 80;
        error: {
          minLength: "習慣名を1文字以上入力してください";
          maxLength: "習慣名は80文字以内で入力してください";
        };
      };
      display_order: {
        min: 1;
        max: 9999;
        error: {
          required: "display_order を入力してください";
          integer: "display_order は整数で入力してください";
          range: "display_order は1〜9999で入力してください";
        };
      };
    };
  };
  actions: {
    setName: (name: string) => void;
    setDisplayOrder: (displayOrder: number) => void;
    validateName: (name?: string) => boolean;
    validateDisplayOrder: (displayOrder?: number) => boolean;
    validate: () => boolean;
    setSaving: (isSaving: boolean) => void;
    submit: () => boolean;
    cancel: () => void;
  };
};

export function SCR003HabitCreatePage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: HabitCreatePageHandlers }): HabitCreatePageModel {
  const NAME_MIN_LENGTH = 1;
  const NAME_MAX_LENGTH = 80;
  const DISPLAY_ORDER_MIN = 1;
  const DISPLAY_ORDER_MAX = 9999;

  const formState = {
    name: "",
    display_order: DISPLAY_ORDER_MIN,
  };

  const errorState: {
    name: string | null;
    display_order: string | null;
  } = {
    name: null,
    display_order: null,
  };

  let isSaving = false;

  const validateName = (name = formState.name): boolean => {
    if (name.length < NAME_MIN_LENGTH) {
      errorState.name = "習慣名を1文字以上入力してください";
      return false;
    }

    if (name.length > NAME_MAX_LENGTH) {
      errorState.name = "習慣名は80文字以内で入力してください";
      return false;
    }

    errorState.name = null;
    return true;
  };

  const validateDisplayOrder = (displayOrder = formState.display_order): boolean => {
    if (!Number.isFinite(displayOrder)) {
      errorState.display_order = "display_order を入力してください";
      return false;
    }

    if (!Number.isInteger(displayOrder)) {
      errorState.display_order = "display_order は整数で入力してください";
      return false;
    }

    if (displayOrder < DISPLAY_ORDER_MIN || displayOrder > DISPLAY_ORDER_MAX) {
      errorState.display_order = "display_order は1〜9999で入力してください";
      return false;
    }

    errorState.display_order = null;
    return true;
  };

  const validate = (): boolean => {
    const isNameValid = validateName();
    const isDisplayOrderValid = validateDisplayOrder();
    return isNameValid && isDisplayOrderValid;
  };

  return {
    screenId,
    ui: {
      form: {
        get name() {
          return formState.name;
        },
        get display_order() {
          return formState.display_order;
        },
      },
      errors: {
        get name() {
          return errorState.name;
        },
        get display_order() {
          return errorState.display_order;
        },
      },
      saveButton: {
        label: "保存",
        get loading() {
          return isSaving;
        },
        get disabled() {
          return isSaving;
        },
      },
      get isSaving() {
        return isSaving;
      },
      validation: {
        name: {
          minLength: NAME_MIN_LENGTH,
          maxLength: NAME_MAX_LENGTH,
          error: {
            minLength: "習慣名を1文字以上入力してください",
            maxLength: "習慣名は80文字以内で入力してください",
          },
        },
        display_order: {
          min: DISPLAY_ORDER_MIN,
          max: DISPLAY_ORDER_MAX,
          error: {
            required: "display_order を入力してください",
            integer: "display_order は整数で入力してください",
            range: "display_order は1〜9999で入力してください",
          },
        },
      },
    },
    actions: {
      setName: (name) => {
        formState.name = name;
        validateName(name);
      },
      setDisplayOrder: (displayOrder) => {
        formState.display_order = displayOrder;
        validateDisplayOrder(displayOrder);
      },
      validateName,
      validateDisplayOrder,
      validate,
      setSaving: (nextIsSaving) => {
        isSaving = nextIsSaving;
      },
      submit: () => {
        if (isSaving || !validate()) {
          return false;
        }
        void handlers?.onSubmit?.();
        return true;
      },
      cancel: () => handlers?.onCancel?.(),
    },
  };
}
