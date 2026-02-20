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
    policyLinks: [],
    copyright: null,
    keyboardOperable: false,
    focusVisible: false,
  };
}
