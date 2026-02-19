export type RoutingScenario = {
  id: string;
  authState: "unauthenticated" | "authenticated";
  consentState: "unknown" | "agreed" | "rejected";
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
];
