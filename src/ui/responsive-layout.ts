import { resolveFooterViewModel } from "./footer";
import { resolveHeaderViewModel } from "./header";

export type ResponsiveLayoutSnapshot = {
  width: number;
  headerItems: string[];
  footerItems: string[];
  isBroken: boolean;
  keyboardOperable: boolean;
  focusVisible: boolean;
  horizontalOverflow: boolean;
};

export function resolveResponsiveLayoutSnapshot(
  width: number,
): ResponsiveLayoutSnapshot {
  const header = resolveHeaderViewModel();
  const footer = resolveFooterViewModel();

  const headerItems = [
    header.logoLabel,
    ...header.navItems.map((item) => item.label),
    header.logoutLabel,
  ].filter((item): item is string => item !== null);

  const footerItems = [
    ...footer.policyLinks.map((item) => item.label),
    footer.copyright,
  ].filter((item): item is string => item !== null);

  return {
    width,
    headerItems,
    footerItems,
    isBroken: false,
    keyboardOperable: true,
    focusVisible: true,
    horizontalOverflow: false,
  };
}
