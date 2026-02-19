import type { ScreenContainerProps } from "./types";

export type PolicyConsentPageHandlers = {
  onAccept?: () => void;
  onReject?: () => void;
};

export function SCR008PolicyConsentPage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: PolicyConsentPageHandlers }) {
  return {
    screenId,
    actions: {
      accept: () => handlers?.onAccept?.(),
      reject: () => handlers?.onReject?.(),
    },
  };
}

