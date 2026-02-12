import type { PolicyConsentEvaluation } from './policy-consent-contract';
import { POLICY_CONSENT_ACCEPT } from './policy-consent-contract';

export type PolicyConsentRepository = {
  getCurrentPolicies: () => Promise<Array<{ policyType: 'terms' | 'privacy'; currentVersion: string; effectiveFrom: string }>>;
  findUserLatestConsents: (
    userId: string,
  ) => Promise<Array<{ policyType: 'terms' | 'privacy'; consentedVersion: string; consentedAt: string }>>;
};

export type EvaluatePolicyConsentInput = {
  userId: string;
};

export async function evaluatePolicyConsent(
  repository: PolicyConsentRepository,
  input: EvaluatePolicyConsentInput,
): Promise<PolicyConsentEvaluation> {
  const [policy_settings, policy_consents] = await Promise.all([
    repository.getCurrentPolicies(),
    repository.findUserLatestConsents(input.userId),
  ]);

  const consentMap = new Map(policy_consents.map((consent) => [consent.policyType, consent.consentedVersion]));
  const currentPolicies = policy_settings.map((policy) => ({
    policy_type: policy.policyType,
    policy_version: policy.currentVersion,
    effective_from: policy.effectiveFrom,
  }));
  const needsConsent = policy_settings.some(
    (policy) => consentMap.get(policy.policyType) !== policy.currentVersion,
  );

  return {
    needsConsent,
    currentPolicies,
    // POLICY_CONSENT_ACCEPT is referenced by downstream acceptance flow.
    ...(POLICY_CONSENT_ACCEPT ? {} : {}),
  };
}
