import { describe, expect, it } from "vitest";
import {
  COMMON_UI_ERROR_CASES,
  COMMON_UI_FOOTER_REQUIRED_ITEMS,
  COMMON_UI_HEADER_REQUIRED_ITEMS,
} from "../../helpers/fixtures";

function resolveHeaderItemsForCurrentImplementation(): string[] {
  return [];
}

function resolveFooterItemsForCurrentImplementation(): string[] {
  return [];
}

function resolveCommonErrorPresentation(status: 400 | 403 | 409 | 500): {
  status: 400 | 403 | 409 | 500;
  message: string;
  traceId: string | null;
} {
  return {
    status,
    message: "NOT_IMPLEMENTED",
    traceId: null,
  };
}

describe("T-014 PR-001 common UI specification tests", () => {
  it("3.1 ヘッダーは共通必須要素を表示する", () => {
    const actualHeaderItems = resolveHeaderItemsForCurrentImplementation();
    expect(actualHeaderItems).toEqual([...COMMON_UI_HEADER_REQUIRED_ITEMS]);
  });

  it("3.1 フッターは共通必須要素を表示する", () => {
    const actualFooterItems = resolveFooterItemsForCurrentImplementation();
    expect(actualFooterItems).toEqual([...COMMON_UI_FOOTER_REQUIRED_ITEMS]);
  });

  for (const errorCase of COMMON_UI_ERROR_CASES) {
    it(`3.2/3.6 エラー分類 ${errorCase.status}(${errorCase.code}) の表示方式を満たす`, () => {
      const presentation = resolveCommonErrorPresentation(errorCase.status);

      expect(presentation.message).toBe(errorCase.expectedMessage);
      expect(Boolean(presentation.traceId)).toBe(errorCase.shouldShowTraceId);
    });
  }
});
