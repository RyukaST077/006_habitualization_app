export type FooterLink = {
  label: string;
  href: string;
  keyboardOperable: boolean;
  focusVisible: boolean;
};

export type FooterViewModel = {
  policyLinks: FooterLink[];
  copyright: string | null;
  keyboardOperable: boolean;
  focusVisible: boolean;
};

export function resolveFooterViewModel(): FooterViewModel {
  return {
    policyLinks: [
      {
        label: "利用規約",
        href: "/terms",
        keyboardOperable: true,
        focusVisible: true,
      },
      {
        label: "プライバシーポリシー",
        href: "/privacy",
        keyboardOperable: true,
        focusVisible: true,
      },
    ],
    copyright: "コピーライト",
    keyboardOperable: true,
    focusVisible: true,
  };
}
