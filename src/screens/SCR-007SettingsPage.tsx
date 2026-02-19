import type { ScreenContainerProps } from "./types";

export type SettingsPageHandlers = {
  onBackHome?: () => void;
  onLogout?: () => void;
};

export function SCR007SettingsPage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: SettingsPageHandlers }) {
  return {
    screenId,
    actions: {
      backHome: () => handlers?.onBackHome?.(),
      logout: () => handlers?.onLogout?.(),
    },
  };
}

