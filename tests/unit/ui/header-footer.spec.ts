import { describe, expect, it } from "vitest";
import {
  COMMON_UI_FOOTER_REQUIRED_ITEMS,
  COMMON_UI_HEADER_REQUIRED_ITEMS,
} from "../../helpers/fixtures";
import { resolveFooterViewModel } from "../../../src/ui/footer";
import { resolveHeaderViewModel } from "../../../src/ui/header";

describe("T-014 PR-002 header/footer red tests", () => {
  it("header has required elements: ロゴ, ホーム, 履歴, 設定, ログアウト", () => {
    const header = resolveHeaderViewModel();
    const headerLabels = [
      header.logoLabel,
      ...header.navItems.map((item) => item.label),
      header.logoutLabel,
    ];

    expect(headerLabels).toEqual([...COMMON_UI_HEADER_REQUIRED_ITEMS]);
  });

  it("header is keyboard operable and focus visible", () => {
    const header = resolveHeaderViewModel();

    expect(header.keyboardOperable).toBe(true);
    expect(header.focusVisible).toBe(true);
  });

  it("footer has required elements: 利用規約, プライバシーポリシー, コピーライト", () => {
    const footer = resolveFooterViewModel();
    const footerLabels = [
      ...footer.policyLinks.map((link) => link.label),
      footer.copyright,
    ];

    expect(footerLabels).toEqual([...COMMON_UI_FOOTER_REQUIRED_ITEMS]);
  });

  it("footer links are keyboard operable and focus visible", () => {
    const footer = resolveFooterViewModel();

    expect(footer.keyboardOperable).toBe(true);
    expect(footer.focusVisible).toBe(true);
    expect(footer.policyLinks.length).toBeGreaterThan(0);
    expect(footer.policyLinks.every((link) => link.keyboardOperable)).toBe(true);
    expect(footer.policyLinks.every((link) => link.focusVisible)).toBe(true);
  });
});
