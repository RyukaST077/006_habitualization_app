export type RoutingScenario = {
  id: string;
  caseId?: "TC-IT-FR-003-002" | "TC-IT-FR-003-003" | "TC-ST-FR-004-004";
  authState: "unauthenticated" | "authenticated";
  consentState: "unknown" | "agreed" | "rejected";
  consentVersionState?: "latest" | "outdated";
  startPath: string;
  expectedPath: string;
  traceIds: readonly string[];
};

export const ROUTING_SCENARIOS: readonly RoutingScenario[] = [
  {
    id: "RS-001",
    authState: "authenticated",
    consentState: "unknown",
    startPath: "/login",
    expectedPath: "/policy-consent",
    traceIds: ["FR-001", "SCR-001", "SCR-008"],
  },
  {
    id: "RS-002",
    authState: "authenticated",
    consentState: "agreed",
    startPath: "/policy-consent",
    expectedPath: "/home",
    traceIds: ["FR-001", "FR-003", "SCR-008", "SCR-002"],
  },
  {
    id: "RS-003",
    authState: "authenticated",
    consentState: "rejected",
    startPath: "/policy-consent",
    expectedPath: "/login",
    traceIds: ["FR-003", "SCR-008", "SCR-001"],
  },
  {
    id: "RS-004",
    caseId: "TC-IT-FR-003-002",
    authState: "authenticated",
    consentState: "unknown",
    consentVersionState: "latest",
    startPath: "/home",
    expectedPath: "/policy-consent",
    traceIds: ["FR-003", "SCR-002", "SCR-008", "policy-consent"],
  },
  {
    id: "RS-005",
    caseId: "TC-IT-FR-003-003",
    authState: "authenticated",
    consentState: "unknown",
    consentVersionState: "outdated",
    startPath: "/home",
    expectedPath: "/policy-consent",
    traceIds: ["FR-003", "SCR-002", "SCR-008", "re-consent", "outdated consent"],
  },
  {
    id: "RS-006",
    caseId: "TC-ST-FR-004-004",
    authState: "authenticated",
    consentState: "rejected",
    consentVersionState: "latest",
    startPath: "/policy-consent",
    expectedPath: "/login",
    traceIds: ["FR-004", "SCR-008", "SCR-001", "reject", "logout"],
  },
];
