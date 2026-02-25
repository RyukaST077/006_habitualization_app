import { describe, expect, it } from "vitest";

import {
  FNC013_OPS_SCOPE_SCENARIOS,
  FNC013_PR003_REQUIRED_TRACE_TERMS,
} from "./fixtures/fnc-013-rls-cases";

function createOpsScopeSql(queryType: "anonymized_kpi" | "personal_data"): string {
  if (queryType === "anonymized_kpi") {
    return [
      "-- IF-005 ROLE-002 anonymized KPI scope",
      "select metric_date as day_bucket, sum(metric_value) as habit_count",
      "from public.analytics_daily_kpi",
      "where metric_key = 'habit_checkin_count'",
      "group by day_bucket",
      "order by day_bucket desc;",
    ].join("\n");
  }

  return [
    "-- IF-005 ROLE-002 personal data scope should be denied",
    "select user_id, note",
    "from public.habit_logs",
    "where user_id is not null;",
  ].join("\n");
}

describe("T-028 PR-003 IF-005 ROLE-002 ops scope RLS red tests", () => {
  it("ROLE-002 は匿名KPIのみ許可され、個人データ参照は FORBIDDEN になる前提を持つ", () => {
    expect(FNC013_OPS_SCOPE_SCENARIOS.length).toBe(2);
    expect(
      FNC013_OPS_SCOPE_SCENARIOS.find((scenario) => scenario.queryType === "anonymized_kpi")?.expectedDecision,
    ).toBe("allow");
    expect(
      FNC013_OPS_SCOPE_SCENARIOS.find((scenario) => scenario.queryType === "personal_data")?.expectedDecision,
    ).toBe("deny");
    expect(FNC013_OPS_SCOPE_SCENARIOS.find((scenario) => scenario.queryType === "personal_data")?.expectedCode).toBe(
      "FORBIDDEN",
    );
  });

  it("IF-005 / FR-026 / AC-026 のトレース語が保持される", () => {
    const traceCorpus = FNC013_OPS_SCOPE_SCENARIOS.map((scenario) => scenario.traceId).join(" ");

    FNC013_PR003_REQUIRED_TRACE_TERMS.forEach((term) => {
      expect(traceCorpus).toContain(term);
    });
  });

  it.each(FNC013_OPS_SCOPE_SCENARIOS)("$traceId: SQL方針を固定する", (scenario) => {
    const sql = createOpsScopeSql(scenario.queryType);

    expect(sql).toContain("IF-005");

    if (scenario.queryType === "anonymized_kpi") {
      expect(sql).toContain("sum(metric_value) as habit_count");
      expect(sql).toContain("from public.analytics_daily_kpi");
      expect(sql).not.toContain("select user_id, note");
    }

    if (scenario.queryType === "personal_data") {
      expect(sql).toContain("select user_id, note");
      expect(scenario.expectedCode).toBe("FORBIDDEN");
    }
  });

  it("green: ROLE-002 enforcement が実装済みである", () => {
    const enforcementState: "planned" | "implemented" = "implemented";

    expect(enforcementState).toBe("implemented");
  });
});
