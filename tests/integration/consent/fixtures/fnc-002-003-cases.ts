export type ConsentRequirementId = "FR-002" | "FR-003" | "FR-004" | "FR-005";
export type ConsentAcceptanceId = "AC-002" | "AC-003" | "AC-004" | "AC-005";
export type ConsentBoundary =
  | "M-002"
  | "M-103"
  | "IF-004"
  | "SCR-008"
  | "SCR-001"
  | "TBL-007"
  | "M-010";
export type ConsentPerspective =
  | "CONSENT_GATE"
  | "RECONSENT_ON_POLICY_UPDATE"
  | "REJECT_LOGOUT"
  | "CONSENT_HISTORY"
  | "UNIQUE_CONSTRAINT"
  | "DUAL_CONSENT_REQUIRED"
  | "AUDIT";

export interface ConsentCaseDefinition {
  traceId: string;
  testCaseId:
    | "TC-IT-FR-002-001"
    | "TC-IT-FR-003-002"
    | "TC-IT-FR-003-003"
    | "TC-ST-FR-004-004"
    | "TC-ST-FR-004-005"
    | "TC-IT-FR-005-001"
    | "TC-IT-FR-005-002"
    | "TC-IT-FR-005-003";
  requirementId: ConsentRequirementId;
  acceptanceId: ConsentAcceptanceId;
  perspective: ConsentPerspective;
  boundary: ConsentBoundary;
  title: string;
  notes: string;
  interfaceId?: "IF-004";
  riskId?: "T-RSK-003";
  constraints?: readonly ("CON-006" | "CON-007")[];
}

export const CONSENT_REQUIRED_REQUIREMENT_IDS: readonly ConsentRequirementId[] = [
  "FR-002",
  "FR-003",
  "FR-004",
  "FR-005",
];

export const CONSENT_REQUIRED_ACCEPTANCE_IDS: readonly ConsentAcceptanceId[] = [
  "AC-002",
  "AC-003",
  "AC-004",
  "AC-005",
];

export const CONSENT_REQUIRED_PERSPECTIVES: readonly ConsentPerspective[] = [
  "CONSENT_GATE",
  "RECONSENT_ON_POLICY_UPDATE",
  "REJECT_LOGOUT",
  "CONSENT_HISTORY",
  "UNIQUE_CONSTRAINT",
  "DUAL_CONSENT_REQUIRED",
  "AUDIT",
];

export const CONSENT_RED_CASES: readonly ConsentCaseDefinition[] = [
  {
    traceId: "T-036/FNC-002/TC-IT-FR-002-001/FR-002/AC-002",
    testCaseId: "TC-IT-FR-002-001",
    requirementId: "FR-002",
    acceptanceId: "AC-002",
    perspective: "CONSENT_GATE",
    boundary: "M-002",
    title: "未同意ユーザーはホーム遷移できず SCR-008 へ強制する",
    notes: "FR-002 AC-002 SCR-008 同意ゲート",
  },
  {
    traceId: "T-036/FNC-002/TC-IT-FR-003-003/FR-003/AC-003",
    testCaseId: "TC-IT-FR-003-003",
    requirementId: "FR-003",
    acceptanceId: "AC-003",
    perspective: "RECONSENT_ON_POLICY_UPDATE",
    boundary: "IF-004",
    title: "policy_settings 更新時に旧版同意ユーザーへ再同意を強制する",
    notes: "FR-003 AC-003 IF-004 policy_settings version update re-consent",
    interfaceId: "IF-004",
    riskId: "T-RSK-003",
  },
  {
    traceId: "T-036/FNC-002/TC-ST-FR-004-004/FR-004/AC-004",
    testCaseId: "TC-ST-FR-004-004",
    requirementId: "FR-004",
    acceptanceId: "AC-004",
    perspective: "REJECT_LOGOUT",
    boundary: "SCR-001",
    title: "同意拒否時に SCR-001 へ戻しセッション破棄する",
    notes: "FR-004 AC-004 reject logout SCR-001",
  },
  {
    traceId: "T-036/FNC-003/TC-IT-FR-005-001/FR-005/AC-005",
    testCaseId: "TC-IT-FR-005-001",
    requirementId: "FR-005",
    acceptanceId: "AC-005",
    perspective: "CONSENT_HISTORY",
    boundary: "M-103",
    title: "terms/privacy 同意受諾時に policy_consents 履歴を登録する",
    notes: "FR-005 AC-005 policy_consents insert history",
  },
  {
    traceId: "T-036/FNC-003/TC-IT-FR-005-002/FR-005/AC-005",
    testCaseId: "TC-IT-FR-005-002",
    requirementId: "FR-005",
    acceptanceId: "AC-005",
    perspective: "UNIQUE_CONSTRAINT",
    boundary: "TBL-007",
    title: "同一版の重複同意は一意制約で no-op 成功として扱う",
    notes: "FR-005 AC-005 CON-006 uq_policy_consents_user_type_ver duplicate no-op",
    constraints: ["CON-006"],
  },
  {
    traceId: "T-036/FNC-002/TC-ST-FR-004-005/FR-004/AC-004",
    testCaseId: "TC-ST-FR-004-005",
    requirementId: "FR-004",
    acceptanceId: "AC-004",
    perspective: "DUAL_CONSENT_REQUIRED",
    boundary: "SCR-008",
    title: "terms/privacy 双方同意が揃わない限り同意完了できない",
    notes: "FR-004 AC-004 CON-007 terms privacy dual consent",
    constraints: ["CON-007"],
  },
  {
    traceId: "T-036/FNC-003/TC-IT-FR-005-003/FR-005/AC-005",
    testCaseId: "TC-IT-FR-005-003",
    requirementId: "FR-005",
    acceptanceId: "AC-005",
    perspective: "AUDIT",
    boundary: "M-010",
    title: "同意受諾/拒否の監査イベントを FR-026 観点で連携確認する",
    notes: "FR-005 AC-005 FR-026 POLICY_CONSENT_ACCEPT POLICY_CONSENT_REJECT",
  },
] as const;
