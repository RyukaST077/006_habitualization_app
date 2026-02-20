import { describe, expect, it } from "vitest";
import {
  COMMON_UI_FOOTER_REQUIRED_ITEMS,
  COMMON_UI_HEADER_REQUIRED_ITEMS,
  COMMON_UI_RESPONSIVE_BREAKPOINTS,
  type CommonUiBreakpointKey,
} from "../../helpers/fixtures";
import { resolveResponsiveLayoutSnapshot } from "../../../src/ui/responsive-layout";

describe("T-014 PR-004 responsive layout red tests", () => {
  const breakpoints: readonly CommonUiBreakpointKey[] = ["sm", "md", "lg"];

  it("3.5: sm/md/lg ブレークポイント定義は 640/768/1024 である", () => {
    expect(COMMON_UI_RESPONSIVE_BREAKPOINTS).toEqual({
      sm: 640,
      md: 768,
      lg: 1024,
    });
  });

  for (const breakpoint of breakpoints) {
    it(`3.5: ${breakpoint} 幅で共通レイアウトが破綻しない`, () => {
      const width = COMMON_UI_RESPONSIVE_BREAKPOINTS[breakpoint];
      const layout = resolveResponsiveLayoutSnapshot(width);

      expect(layout.width).toBe(width);
      expect(layout.headerItems).toEqual([...COMMON_UI_HEADER_REQUIRED_ITEMS]);
      expect(layout.footerItems).toEqual([...COMMON_UI_FOOTER_REQUIRED_ITEMS]);
      expect(layout.isBroken).toBe(false);
      expect(layout.horizontalOverflow).toBe(false);
      expect(layout.keyboardOperable).toBe(true);
      expect(layout.focusVisible).toBe(true);
    });
  }
});
