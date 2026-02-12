export const POLICY_CONSENT_ACCEPT = 'POLICY_CONSENT_ACCEPT';
export const POLICY_CONSENT_REJECT = 'POLICY_CONSENT_REJECT';
export const VERSION_CONFLICT = 'VERSION_CONFLICT';
export const POLICY_VERSION_MISMATCH = 'POLICY_VERSION_MISMATCH';
export const CONSENT_ALREADY_EXISTS = 'CONSENT_ALREADY_EXISTS';
export const POLICY_UPDATE_FAILED = 'POLICY_UPDATE_FAILED';

export type PolicyType = 'terms' | 'privacy';

export type PolicyConsentItem = {
  policy_type: PolicyType;
  policy_version: string;
};

export type CurrentPolicySnapshot = {
  policy_type: PolicyType;
  policy_version: string;
  effective_from: string;
};

export type PolicyConsentEvaluation = {
  needsConsent: boolean;
  currentPolicies: CurrentPolicySnapshot[];
};

export type PolicyConsentActionResult = {
  accepted: boolean;
  redirectTo: '/home' | '/login';
  auditEvent: typeof POLICY_CONSENT_ACCEPT | typeof POLICY_CONSENT_REJECT;
  trace_id: string;
};

export type PolicyConsentConflictCode =
  | typeof VERSION_CONFLICT
  | typeof POLICY_VERSION_MISMATCH
  | typeof CONSENT_ALREADY_EXISTS;

export function normalizePolicyConsentConflict(error: unknown): PolicyConsentConflictCode | null {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes(CONSENT_ALREADY_EXISTS)) {
    return CONSENT_ALREADY_EXISTS;
  }

  if (
    message.includes(VERSION_CONFLICT) ||
    message.includes(POLICY_VERSION_MISMATCH) ||
    message.includes('POLICY_VERSION_CONFLICT')
  ) {
    return VERSION_CONFLICT;
  }

  if (message.includes('duplicate key') || message.includes('23505')) {
    return CONSENT_ALREADY_EXISTS;
  }

  return null;
}
