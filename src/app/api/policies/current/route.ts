import { evaluatePolicyConsent } from '../../../../../server/policies/evaluate-policy-consent';

const POLICY_CURRENT_ROUTE = 'policies/current';

const policy_settings = [
  {
    policyType: 'terms' as const,
    currentVersion: 'v1.0',
    effectiveFrom: new Date(0).toISOString(),
  },
  {
    policyType: 'privacy' as const,
    currentVersion: 'v1.0',
    effectiveFrom: new Date(0).toISOString(),
  },
];

const policy_consents: Array<{
  policyType: 'terms' | 'privacy';
  consentedVersion: string;
  consentedAt: string;
}> = [];

export async function GET(): Promise<Response> {
  const evaluation = await evaluatePolicyConsent(
    {
      async getCurrentPolicies() {
        return policy_settings;
      },
      async findUserLatestConsents() {
        return policy_consents;
      },
    },
    { userId: 'anonymous' },
  );

  return Response.json({
    route: POLICY_CURRENT_ROUTE,
    terms: evaluation.currentPolicies.find((policy) => policy.policy_type === 'terms'),
    privacy: evaluation.currentPolicies.find((policy) => policy.policy_type === 'privacy'),
    needsConsent: evaluation.needsConsent,
  });
}

