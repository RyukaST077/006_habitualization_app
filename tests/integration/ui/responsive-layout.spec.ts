import { describe, expect, it } from "vitest";
import { SCR001LoginPage } from "../../../src/screens/SCR-001LoginPage";
import {
  buildCommonUiRequiredFooterItems,
  buildCommonUiRequiredHeaderItems,
  COMMON_UI_BREAKPOINT_CASES,
  COMMON_UI_RESPONSIVE_BREAKPOINTS,
} from "../../helpers/fixtures";
import { SCR001_A11Y_ENTER_KEY_EXPECTATION } from "../../helpers/ui/common-ui-fixtures";
import { resolveResponsiveLayoutSnapshot } from "../../../src/ui/responsive-layout";

describe("T-014 PR-004 responsive layout red tests", () => {
  it("3.5: sm/md/lg ブレークポイント定義は 640/768/1024 である", () => {
    expect(COMMON_UI_RESPONSIVE_BREAKPOINTS).toEqual({
      sm: 640,
      md: 768,
      lg: 1024,
    });
  });

  for (const breakpointCase of COMMON_UI_BREAKPOINT_CASES) {
    it(`3.5: ${breakpointCase.key} 幅で SCR-001 ログイン導線のレイアウトが破綻しない`, () => {
      const width = breakpointCase.width;
      const layout = resolveResponsiveLayoutSnapshot(width);
      const page = SCR001LoginPage({ screenId: "SCR-001" });

      expect(layout.width).toBe(width);
      expect(layout.headerItems).toEqual(buildCommonUiRequiredHeaderItems());
      expect(layout.footerItems).toEqual(buildCommonUiRequiredFooterItems());
      expect(layout.isBroken).toBe(false);
      expect(layout.horizontalOverflow).toBe(false);
      expect(layout.keyboardOperable).toBe(true);
      expect(layout.focusVisible).toBe(true);
      expect(page.ui.loginButton.ariaLabel).toBe(SCR001_A11Y_ENTER_KEY_EXPECTATION.ariaLabel);
      expect(page.ui.loginButton.label).toBe(SCR001_A11Y_ENTER_KEY_EXPECTATION.ariaLabel);
    });
  }
});
