import { describe, expect, it } from "vitest";
import {
  buildCommonUiRequiredFooterItems,
  buildCommonUiRequiredHeaderItems,
} from "../../helpers/fixtures";
import { resolveFooterViewModel } from "../../../src/ui/footer";
import { resolveHeaderViewModel } from "../../../src/ui/header";

function resolveHeaderItemsForCurrentImplementation(): string[] {
  const header = resolveHeaderViewModel();

  return [
    header.logoLabel,
    ...header.navItems.map((item) => item.label),
    header.logoutLabel,
  ].filter((item): item is string => item !== null);
}

function resolveFooterItemsForCurrentImplementation(): string[] {
  const footer = resolveFooterViewModel();

  return [
    ...footer.policyLinks.map((item) => item.label),
    footer.copyright,
  ].filter((item): item is string => item !== null);
}

describe("T-014 PR-001 common UI specification tests", () => {
  it("3.1 ヘッダーは共通必須要素を表示する", () => {
    const actualHeaderItems = resolveHeaderItemsForCurrentImplementation();
    expect(actualHeaderItems).toEqual(buildCommonUiRequiredHeaderItems());
  });

  it("3.1 フッターは共通必須要素を表示する", () => {
    const actualFooterItems = resolveFooterItemsForCurrentImplementation();
    expect(actualFooterItems).toEqual(buildCommonUiRequiredFooterItems());
  });
});
