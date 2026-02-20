import { describe, expect, it } from "vitest";
import {
  buildCommonUiRequiredFooterItems,
  buildCommonUiRequiredHeaderItems,
  COMMON_UI_BREAKPOINT_CASES,
  COMMON_UI_RESPONSIVE_BREAKPOINTS,
} from "../../helpers/fixtures";
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
    it(`3.5: ${breakpointCase.key} 幅で共通レイアウトが破綻しない`, () => {
      const width = breakpointCase.width;
      const layout = resolveResponsiveLayoutSnapshot(width);

      expect(layout.width).toBe(width);
      expect(layout.headerItems).toEqual(buildCommonUiRequiredHeaderItems());
      expect(layout.footerItems).toEqual(buildCommonUiRequiredFooterItems());
      expect(layout.isBroken).toBe(false);
      expect(layout.horizontalOverflow).toBe(false);
      expect(layout.keyboardOperable).toBe(true);
      expect(layout.focusVisible).toBe(true);
    });
  }
});
