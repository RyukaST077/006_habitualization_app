export type HeaderNavItem = {
  label: string;
  href: string;
  keyboardOperable: boolean;
  focusVisible: boolean;
};

export type HeaderViewModel = {
  logoLabel: string | null;
  navItems: HeaderNavItem[];
  logoutLabel: string | null;
  keyboardOperable: boolean;
  focusVisible: boolean;
};

export function resolveHeaderViewModel(): HeaderViewModel {
  return {
    logoLabel: null,
    navItems: [],
    logoutLabel: null,
    keyboardOperable: false,
    focusVisible: false,
  };
}
