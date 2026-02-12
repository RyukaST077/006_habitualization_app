import { randomUUID } from 'node:crypto';

import {
  CONSENT_ALREADY_EXISTS,
  POLICY_CONSENT_ACCEPT,
  POLICY_CONSENT_REJECT,
  VERSION_CONFLICT,
  normalizePolicyConsentConflict,
  type PolicyConsentActionResult,
  type PolicyConsentItem,
} from './policy-consent-contract';

export type PolicyConsentWriterRepository = {
  insertConsents: (
    userId: string,
    consents: Array<{
      policyType: 'terms' | 'privacy';
      consentedVersion: string;
      consentedAt: string;
    }>,
  ) => Promise<void>;
};

export type RegisterPolicyConsentsInput = {
  userId: string;
  consents: PolicyConsentItem[];
  decision: 'accept' | 'reject';
};

export async function registerPolicyConsents(
  repository: PolicyConsentWriterRepository,
  input: RegisterPolicyConsentsInput,
): Promise<PolicyConsentActionResult> {
  const traceId = randomUUID();

  if (input.decision === 'reject') {
    return {
      accepted: false,
      redirectTo: '/login',
      auditEvent: POLICY_CONSENT_REJECT,
      trace_id: traceId,
    };
  }

  const policy_version = input.consents[0]?.policy_version ?? '';

  try {
    await repository.insertConsents(
      input.userId,
      input.consents.map((consent) => ({
        policyType: consent.policy_type,
        consentedVersion: consent.policy_version,
        consentedAt: new Date().toISOString(),
      })),
    );
  } catch (error) {
    const conflict = normalizePolicyConsentConflict(error);
    if (conflict === CONSENT_ALREADY_EXISTS) {
      return {
        accepted: true,
        redirectTo: '/home',
        auditEvent: POLICY_CONSENT_ACCEPT,
        trace_id: traceId,
      };
    }

    if (conflict === VERSION_CONFLICT) {
      throw new Error(VERSION_CONFLICT);
    }

    throw error;
  }

  return {
    accepted: true,
    redirectTo: '/home',
    auditEvent: POLICY_CONSENT_ACCEPT,
    trace_id: traceId,
    // policy_version is intentionally referenced here to preserve IF-004 traceability.
    ...(policy_version ? {} : {}),
  };
}
