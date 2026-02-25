export interface T030AppErrorScenario {
  traceId: string;
  title: string;
  expectedStatus: 403 | 409 | 500;
  expectedCode: "FORBIDDEN" | "DOMAIN_CONFLICT" | "INTERNAL_ERROR";
  requirementId: string;
  expectedMessage: string;
}

export const T030_APP_ERROR_SCENARIOS: readonly T030AppErrorScenario[] = [
  {
    traceId: "T-030/IF-002/common-error/403-forbidden-fr-025",
    title: "403 FORBIDDEN は requirement_id=FR-025 を返す",
    expectedStatus: 403,
    expectedCode: "FORBIDDEN",
    requirementId: "FR-025",
    expectedMessage: "access denied",
  },
  {
    traceId: "T-030/IF-002/common-error/409-domain-conflict-fr-013",
    title: "409 DOMAIN_CONFLICT は業務競合の requirement_id を保持する",
    expectedStatus: 409,
    expectedCode: "DOMAIN_CONFLICT",
    requirementId: "FR-013",
    expectedMessage: "domain conflict",
  },
  {
    traceId: "T-030/IF-002/common-error/500-internal-error-trace-id",
    title: "500 INTERNAL_ERROR は trace_id を必須とする",
    expectedStatus: 500,
    expectedCode: "INTERNAL_ERROR",
    requirementId: "FR-011",
    expectedMessage: "unexpected error",
  },
] as const;
