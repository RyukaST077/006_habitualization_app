import type { HabitLifecycleStatus, ScreenContainerProps } from "./types";

export type HabitEditPageHandlers = {
  onSave?: () => void;
  onBack?: () => void;
  onArchive?: () => void;
  onResume?: () => void;
  onNavigateHome?: () => void;
};

export type HabitEditPageParams = {
  habitId: string;
  name?: string;
  displayOrder?: number;
  status?: HabitLifecycleStatus;
};

export type HabitEditConfirmationAction = "archive" | "resume";

export type HabitEditPageModel = {
  screenId: ScreenContainerProps["screenId"];
  params: HabitEditPageParams;
  ui: {
    name: string;
    displayOrder: number;
    status: HabitLifecycleStatus;
    confirmationModal: {
      isOpen: boolean;
      action: HabitEditConfirmationAction | null;
    };
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
    confirmLifecycleAction: () => void;
    closeConfirmationModal: () => void;
    handleHttpError: (status: number) => void;
  };
};

export function SCR004HabitEditPage({
  screenId,
  params,
  handlers,
}: ScreenContainerProps & { params: HabitEditPageParams; handlers?: HabitEditPageHandlers }): HabitEditPageModel {
  const name = params.name ?? "";
  const displayOrder = params.displayOrder ?? 1;
  const status = params.status ?? "active";
  const archiveVisible = status === "active";
  const resumeVisible = status === "archived";
  const confirmationModal = {
    isOpen: false,
    action: null as HabitEditConfirmationAction | null,
  };

  return {
    screenId,
    params,
    ui: {
      name,
      displayOrder,
      status,
      confirmationModal,
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
      archive: () => {
        confirmationModal.isOpen = true;
        confirmationModal.action = "archive";
      },
      resume: () => {
        confirmationModal.isOpen = true;
        confirmationModal.action = "resume";
      },
      confirmLifecycleAction: () => {
        if (!confirmationModal.isOpen || confirmationModal.action === null) {
          return;
        }

        if (confirmationModal.action === "archive") {
          handlers?.onArchive?.();
        } else {
          handlers?.onResume?.();
        }

        confirmationModal.isOpen = false;
        confirmationModal.action = null;
      },
      closeConfirmationModal: () => {
        confirmationModal.isOpen = false;
        confirmationModal.action = null;
      },
      handleHttpError: (statusCode: number) => {
        if (statusCode === 403) {
          if (handlers?.onNavigateHome) {
            handlers.onNavigateHome();
            return;
          }
          handlers?.onBack?.();
        }
      },
    },
  };
}
