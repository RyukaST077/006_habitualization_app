import { describe, expect, it } from "vitest";

import {
  FNC005_M004_INVALID_INPUT_RED_CASES,
  FNC005_RED_CASES,
} from "../../integration/checkins/fixtures/fnc-005-cases";

type ResolveLogDateFn = (nowUtc: string, timezone: string, cutoffTime: string) => unknown;

const BUSINESS_DATE_SERVICE_MODULE_PATH = "../../../src/server/domain/time/BusinessDateService";

const loadResolveLogDate = async (): Promise<ResolveLogDateFn> => {
  try {
    const module = (await import(BUSINESS_DATE_SERVICE_MODULE_PATH)) as {
      resolveLogDate?: ResolveLogDateFn;
      default?: { resolveLogDate?: ResolveLogDateFn };
    };
    if (typeof module.resolveLogDate === "function") {
      return module.resolveLogDate;
    }
    if (typeof module.default?.resolveLogDate === "function") {
      return module.default.resolveLogDate;
    }
  } catch {
    // T-043 で実装されるまで import 失敗を許容し、Redを維持する
  }

  return () => {
    throw new Error("resolveLogDate is not implemented");
  };
};

const toLogDate = (result: unknown): string => {
  if (typeof result === "string") {
    return result;
  }
  if (result !== null && typeof result === "object" && "logDate" in result) {
    const logDate = (result as { logDate?: unknown }).logDate;
    if (typeof logDate === "string") {
      return logDate;
    }
  }
  throw new Error("resolveLogDate returned unsupported result");
};

describe("T-042 C-002 M-004 cutoff boundary red tests", () => {
  const cutoffBoundaryCases = FNC005_RED_CASES.filter((testCase) => testCase.boundary === "M-004");

  it("02:59 は前日判定、03:00 は当日判定で固定する", () => {
    expect(cutoffBoundaryCases.map((testCase) => testCase.input.day_cutoff_time)).toEqual(["03:00", "03:00"]);
    expect(cutoffBoundaryCases.map((testCase) => testCase.expectedLogDate)).toEqual(["2026-03-02", "2026-03-03"]);
  });

  it.each(cutoffBoundaryCases)("$traceId", async (testCase) => {
    const resolveLogDate = await loadResolveLogDate();
    const actual = toLogDate(
      resolveLogDate(testCase.input.nowUtc, testCase.input.timezone, testCase.input.day_cutoff_time),
    );
    expect(actual).toBe(testCase.expectedLogDate);
  });

  it.each(FNC005_M004_INVALID_INPUT_RED_CASES)("$traceId", async (testCase) => {
    const resolveLogDate = await loadResolveLogDate();
    await expect(
      Promise.resolve().then(() =>
        resolveLogDate(testCase.input.nowUtc, testCase.input.timezone, testCase.input.day_cutoff_time),
      ),
    ).rejects.toMatchObject({ code: testCase.expectedErrorCode });
  });
});
