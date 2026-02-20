import { describe, expect, it } from "vitest";

import {
  REPOSITORY_CATEGORIES,
  REPOSITORY_RED_CASES,
} from "./fixtures/repository-cases";

describe("T-024 PR-001 repository red test plan", () => {
  it("M-101 M-102 M-103 M-104: 対象Repositoryを全て含む", () => {
    const covered = new Set(REPOSITORY_RED_CASES.map((testCase) => testCase.repositoryId));

    expect(covered.has("M-101")).toBe(true);
    expect(covered.has("M-102")).toBe(true);
    expect(covered.has("M-103")).toBe(true);
    expect(covered.has("M-104")).toBe(true);
  });

  it("CRUD/Tx/競合: 観点を固定化する", () => {
    const covered = new Set(REPOSITORY_RED_CASES.map((testCase) => testCase.category));

    REPOSITORY_CATEGORIES.forEach((category) => {
      expect(covered.has(category)).toBe(true);
    });
  });

  it.each(REPOSITORY_RED_CASES)(
    "$traceId: 実装前のため失敗することを期待する Red テスト",
    async () => {
      expect("repository-implementation-status").toBe("green");
    },
  );
});
