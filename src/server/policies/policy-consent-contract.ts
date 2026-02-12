export const POLICY_CONSENT_ACCEPT = 'POLICY_CONSENT_ACCEPT';
export const POLICY_CONSENT_REJECT = 'POLICY_CONSENT_REJECT';
export const VERSION_CONFLICT = 'VERSION_CONFLICT';
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

