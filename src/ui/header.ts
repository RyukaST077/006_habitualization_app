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
    logoLabel: "ロゴ",
    navItems: [
      {
        label: "ホーム",
        href: "/home",
        keyboardOperable: true,
        focusVisible: true,
      },
      {
        label: "履歴",
        href: "/history",
        keyboardOperable: true,
        focusVisible: true,
      },
      {
        label: "設定",
        href: "/settings",
        keyboardOperable: true,
        focusVisible: true,
      },
    ],
    logoutLabel: "ログアウト",
    keyboardOperable: true,
    focusVisible: true,
  };
}
