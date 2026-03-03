import type { HabitLifecycleStatus, ScreenContainerProps } from "./types";

export type HabitEditPageHandlers = {
  onSave?: () => void;
  onBack?: () => void;
  onArchive?: () => void;
  onResume?: () => void;
};

export type HabitEditPageParams = {
  habitId: string;
  status?: HabitLifecycleStatus;
};

export type HabitEditPageModel = {
  screenId: ScreenContainerProps["screenId"];
  params: HabitEditPageParams;
  ui: {
    status: HabitLifecycleStatus;
    buttons: {
      archive: {
        visible: boolean;
      };
      resume: {
        visible: boolean;
      };
    };
  };
  actions: {
    save: () => void;
    back: () => void;
    archive: () => void;
    resume: () => void;
    handleHttpError: (status: number) => void;
  };
};

export function SCR004HabitEditPage({
  screenId,
  params,
  handlers,
}: ScreenContainerProps & { params: HabitEditPageParams; handlers?: HabitEditPageHandlers }): HabitEditPageModel {
  const status = params.status ?? "active";
  const archiveVisible = status === "active";
  const resumeVisible = status === "archived";

  return {
    screenId,
    params,
    ui: {
      status,
      buttons: {
        archive: {
          visible: archiveVisible,
        },
        resume: {
          visible: resumeVisible,
        },
      },
    },
    actions: {
      save: () => handlers?.onSave?.(),
      back: () => handlers?.onBack?.(),
      archive: () => handlers?.onArchive?.(),
      resume: () => handlers?.onResume?.(),
      handleHttpError: (statusCode: number) => {
        if (statusCode === 403) {
          handlers?.onBack?.();
        }
      },
    },
  };
}
