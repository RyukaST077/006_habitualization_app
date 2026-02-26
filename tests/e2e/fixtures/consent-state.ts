export type ConsentFailureScenario = {
  id: string;
  caseId: "TC-IT-FR-003-002" | "TC-IT-FR-003-003" | "TC-ST-FR-004-004" | "TC-IT-FR-026-002";
  authState: "authenticated";
  consentState: "unknown" | "rejected";
  consentVersionState: "missing" | "outdated";
  startPath: "/home" | "/policy-consent";
  expectedPath: "/policy-consent" | "/login";
  traceIds: readonly string[];
};

export const CONSENT_FAILURE_SCENARIOS: readonly ConsentFailureScenario[] = [
  {
    id: "CS-001",
    caseId: "TC-IT-FR-003-002",
    authState: "authenticated",
    consentState: "unknown",
    consentVersionState: "missing",
    startPath: "/home",
    expectedPath: "/policy-consent",
    traceIds: ["FR-003", "SCR-002", "SCR-008"],
  },
  {
    id: "CS-002",
    caseId: "TC-IT-FR-003-003",
    authState: "authenticated",
    consentState: "unknown",
    consentVersionState: "outdated",
    startPath: "/home",
    expectedPath: "/policy-consent",
    traceIds: ["FR-003", "SCR-002", "SCR-008", "re-consent"],
  },
  {
    id: "CS-003",
    caseId: "TC-ST-FR-004-004",
    authState: "authenticated",
    consentState: "rejected",
    consentVersionState: "outdated",
    startPath: "/policy-consent",
    expectedPath: "/login",
    traceIds: ["FR-004", "SCR-008", "SCR-001", "logout"],
  },
  {
    id: "CS-004",
    caseId: "TC-IT-FR-026-002",
    authState: "authenticated",
    consentState: "rejected",
    consentVersionState: "outdated",
    startPath: "/policy-consent",
    expectedPath: "/login",
    traceIds: ["FR-026", "CON-007", "SCR-008", "POLICY_CONSENT_REJECT"],
  },
];
