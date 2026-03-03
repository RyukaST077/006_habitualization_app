export type Fnc005RequirementId = "FR-010";
export type Fnc005AcceptanceId = "AC-010";
export type Fnc005TestCaseId = "TC-UT-FR-010-001" | "TC-UT-FR-010-002" | "TC-IT-FR-010-003";
export type Fnc005Boundary = "M-004" | "IF-002";

export interface Fnc005InputAxis {
  timezone: "Asia/Tokyo" | "UTC";
  day_cutoff_time: "03:00";
  nowUtc: string;
}

export interface Fnc005CaseDefinition {
  traceId: string;
  testCaseId: Fnc005TestCaseId;
  requirementId: Fnc005RequirementId;
  acceptanceId: Fnc005AcceptanceId;
  boundary: Fnc005Boundary;
  title: string;
  notes: string;
  input: Fnc005InputAxis;
  expectedLogDate: string;
}

export type Fnc005M004ErrorCode = "INVALID_TIMEZONE" | "INVALID_CUTOFF_TIME";

export interface Fnc005M004InvalidInputRedCase {
  traceId: string;
  boundary: "M-004";
  title: string;
  input: {
    timezone: string;
    day_cutoff_time: string;
    nowUtc: string;
  };
  expectedErrorCode: Fnc005M004ErrorCode;
}

export const FNC005_REQUIRED_REQUIREMENT_IDS: readonly Fnc005RequirementId[] = ["FR-010"];
export const FNC005_REQUIRED_ACCEPTANCE_IDS: readonly Fnc005AcceptanceId[] = ["AC-010"];
export const FNC005_REQUIRED_TEST_CASE_IDS: readonly Fnc005TestCaseId[] = [
  "TC-UT-FR-010-001",
  "TC-UT-FR-010-002",
  "TC-IT-FR-010-003",
];

export const FNC005_RED_CASES: readonly Fnc005CaseDefinition[] = [
  {
    traceId: "T-042/C-001/FNC-005/TC-UT-FR-010-001/FR-010/AC-010/local-before-cutoff",
    testCaseId: "TC-UT-FR-010-001",
    requirementId: "FR-010",
    acceptanceId: "AC-010",
    boundary: "M-004",
    title: "localTime が cutoff より前なら前営業日を採用する",
    notes:
      "FR-010 AC-010 M-004 nowUtc=2026-03-02T17:59:00Z timezone=Asia/Tokyo day_cutoff_time=03:00",
    input: {
      timezone: "Asia/Tokyo",
      day_cutoff_time: "03:00",
      nowUtc: "2026-03-02T17:59:00Z",
    },
    expectedLogDate: "2026-03-02",
  },
  {
    traceId: "T-042/C-001/FNC-005/TC-UT-FR-010-002/FR-010/AC-010/local-at-cutoff",
    testCaseId: "TC-UT-FR-010-002",
    requirementId: "FR-010",
    acceptanceId: "AC-010",
    boundary: "M-004",
    title: "localTime が cutoff と等しい時点で当営業日に切り替える",
    notes:
      "FR-010 AC-010 M-004 nowUtc=2026-03-02T18:00:00Z timezone=Asia/Tokyo day_cutoff_time=03:00",
    input: {
      timezone: "Asia/Tokyo",
      day_cutoff_time: "03:00",
      nowUtc: "2026-03-02T18:00:00Z",
    },
    expectedLogDate: "2026-03-03",
  },
  {
    traceId: "T-042/C-001/FNC-005/TC-IT-FR-010-003/FR-010/AC-010/checkins-timezone-diff",
    testCaseId: "TC-IT-FR-010-003",
    requirementId: "FR-010",
    acceptanceId: "AC-010",
    boundary: "IF-002",
    title: "同一 nowUtc でも timezone により /api/checkins の log_date が変わる",
    notes:
      "FR-010 AC-010 IF-002 nowUtc=2026-03-02T18:30:00Z timezone=UTC day_cutoff_time=03:00",
    input: {
      timezone: "UTC",
      day_cutoff_time: "03:00",
      nowUtc: "2026-03-02T18:30:00Z",
    },
    expectedLogDate: "2026-03-02",
  },
] as const;

export const FNC005_M004_INVALID_INPUT_RED_CASES: readonly Fnc005M004InvalidInputRedCase[] = [
  {
    traceId: "T-042/C-002/FNC-005/M-004/invalid-timezone",
    boundary: "M-004",
    title: "不正 timezone では INVALID_TIMEZONE を返す",
    input: {
      timezone: "Asia/Invalid",
      day_cutoff_time: "03:00",
      nowUtc: "2026-03-02T18:00:00Z",
    },
    expectedErrorCode: "INVALID_TIMEZONE",
  },
  {
    traceId: "T-042/C-002/FNC-005/M-004/invalid-cutoff",
    boundary: "M-004",
    title: "不正 cutoff では INVALID_CUTOFF_TIME を返す",
    input: {
      timezone: "Asia/Tokyo",
      day_cutoff_time: "24:00",
      nowUtc: "2026-03-02T18:00:00Z",
    },
    expectedErrorCode: "INVALID_CUTOFF_TIME",
  },
] as const;
