export type Fnc011AuditRequirementId = "FR-022";
export type Fnc011AuditAcceptanceId = "AC-022";
export type Fnc011AuditTestCaseId =
  | "TC-IT-FR-022-001"
  | "TC-IT-FR-022-002"
  | "TC-ST-FR-022-003";

export interface Fnc011AuditSuccessCase {
  traceId: string;
  testCaseId: "TC-IT-FR-022-001" | "TC-IT-FR-022-002";
  requirementId: Fnc011AuditRequirementId;
  acceptanceId: Fnc011AuditAcceptanceId;
  actorUserId: string;
  targetId: string;
  input: {
    timezone: string;
    dayCutoffTime: string;
    version: number;
  };
  expectedResult: "success";
}

export interface Fnc011AuditFailureCase {
  traceId: string;
  testCaseId: "TC-ST-FR-022-003";
  requirementId: Fnc011AuditRequirementId;
  acceptanceId: Fnc011AuditAcceptanceId;
  actorUserId: string;
  targetId: string;
  input: {
    timezone: string;
    dayCutoffTime: string;
    version: number;
  };
  expectedResult: "failure";
  expectedErrorCode: "DOMAIN_CONFLICT";
}

export const FNC011_AUDIT_SUCCESS_CASES: readonly Fnc011AuditSuccessCase[] = [
  {
    traceId: "T-028/C-004/FNC-011/TC-IT-FR-022-001/settings-update-audit-success-timezone",
    testCaseId: "TC-IT-FR-022-001",
    requirementId: "FR-022",
    acceptanceId: "AC-022",
    actorUserId: "user-audit-001",
    targetId: "user-audit-001",
    input: {
      timezone: "UTC",
      dayCutoffTime: "04:00",
      version: 1,
    },
    expectedResult: "success",
  },
  {
    traceId: "T-028/C-004/FNC-011/TC-IT-FR-022-002/settings-update-audit-success-cutoff",
    testCaseId: "TC-IT-FR-022-002",
    requirementId: "FR-022",
    acceptanceId: "AC-022",
    actorUserId: "user-audit-001",
    targetId: "user-audit-001",
    input: {
      timezone: "UTC",
      dayCutoffTime: "05:30",
      version: 2,
    },
    expectedResult: "success",
  },
] as const;

export const FNC011_AUDIT_FAILURE_CASE: Fnc011AuditFailureCase = {
  traceId: "T-028/C-004/FNC-011/TC-ST-FR-022-003/settings-update-audit-failure-with-reason",
  testCaseId: "TC-ST-FR-022-003",
  requirementId: "FR-022",
  acceptanceId: "AC-022",
  actorUserId: "user-audit-001",
  targetId: "user-audit-001",
  input: {
    timezone: "Asia/Tokyo",
    dayCutoffTime: "05:45",
    version: 1,
  },
  expectedResult: "failure",
  expectedErrorCode: "DOMAIN_CONFLICT",
};
