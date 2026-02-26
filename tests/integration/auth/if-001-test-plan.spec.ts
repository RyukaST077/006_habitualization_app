import { describe, expect, it } from "vitest";

import {
  IF001_RED_CASES,
  IF001_RED_TO_GREEN_TARGETS,
  IF001_REQUIRED_ACCEPTANCE_IDS,
  IF001_REQUIRED_BOUNDARIES,
  IF001_REQUIRED_PERSPECTIVES,
  IF001_REQUIRED_REQUIREMENT_IDS,
  IF001_RESPONSIBILITY_MAP,
} from "./fixtures/if-001-cases";
import { createIf001TestHarness } from "./helpers/if-001-test-harness";

const IF001_SUITE_COMMAND = "npm run test -- tests/integration/auth/if-001-*.spec.ts";

describe("T-033 PR-001 FNC-001/IF-001/SCR-001 red test plan", () => {
  it("FR-001/AC-001 をケース定義へトレースする", () => {
    const harness = createIf001TestHarness();
    harness.assertRequirementTrace(
      IF001_RED_CASES,
      IF001_REQUIRED_REQUIREMENT_IDS,
      IF001_REQUIRED_ACCEPTANCE_IDS,
    );
  });

  it("M-001/IF-001/SCR-001/M-010 の責務境界を固定する", () => {
    const harness = createIf001TestHarness();
    harness.assertResponsibilityBoundaries(IF001_RESPONSIBILITY_MAP, IF001_REQUIRED_BOUNDARIES);
  });

  it("認証開始・コールバック遷移・失敗復帰・監査の観点を Red で固定する", () => {
    const coveredPerspectives = new Set(IF001_RED_CASES.map((testCase) => testCase.perspective));

    IF001_REQUIRED_PERSPECTIVES.forEach((perspective) => {
      expect(coveredPerspectives.has(perspective)).toBe(true);
    });
  });

  it.each(IF001_RED_CASES)("$traceId: FNC-001/IF-001/SCR-001 の境界トレースを保持する", (testCase) => {
    const harness = createIf001TestHarness();

    harness.assertRedPlanningCase(testCase);
    expect(testCase.title.length).toBeGreaterThan(0);
  });

  it.each(IF001_RED_TO_GREEN_TARGETS)("$traceId: T-034 で Green 化する対象を固定する", (target) => {
    expect(target.targetSpecPath).toContain("tests/integration/auth/if-001-");
    expect(target.expectedPhase).toBe("RED");
  });

  it("T-033 認証スイートの実行導線を単一コマンドで保持する", () => {
    expect(IF001_SUITE_COMMAND).toBe("npm run test -- tests/integration/auth/if-001-*.spec.ts");
  });

  it("red: T-034 未実装のため認証フローは planned のまま失敗させる", () => {
    const harness = createIf001TestHarness();
    expect(harness.getT034ImplementationState()).toBe("implemented");
  });
});
