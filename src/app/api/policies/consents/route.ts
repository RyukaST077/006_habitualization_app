import {
  POLICY_UPDATE_FAILED,
  VERSION_CONFLICT,
  type PolicyConsentItem,
} from '../../../../../server/policies/policy-consent-contract';
import { registerPolicyConsents } from '../../../../../server/policies/register-policy-consents';

const POLICY_CONSENTS_ROUTE = 'policies/consents';

const policy_consents: Array<{
  userId: string;
  policyType: 'terms' | 'privacy';
  consentedVersion: string;
  consentedAt: string;
}> = [];

type RequestBody = {
  user_id?: string;
  decision?: 'accept' | 'reject';
  consents?: PolicyConsentItem[];
};

function parseBody(value: unknown): RequestBody {
  if (typeof value !== 'object' || value === null) {
    return {};
  }

  const candidate = value as RequestBody;
  return {
    user_id: typeof candidate.user_id === 'string' ? candidate.user_id : undefined,
    decision: candidate.decision === 'accept' || candidate.decision === 'reject' ? candidate.decision : undefined,
    consents: Array.isArray(candidate.consents) ? candidate.consents : undefined,
  };
}

export async function POST(request: Request): Promise<Response> {
  const payload = parseBody(await request.json());
  const userId = payload.user_id ?? 'anonymous';
  const decision = payload.decision ?? 'accept';
  const consents = payload.consents ?? [];

  try {
    const result = await registerPolicyConsents(
      {
        async insertConsents(targetUserId, rows) {
          rows.forEach((row) => {
            policy_consents.push({
              userId: targetUserId,
              policyType: row.policyType,
              consentedVersion: row.consentedVersion,
              consentedAt: row.consentedAt,
            });
          });
        },
      },
      {
        userId,
        decision,
        consents,
      },
    );

    return Response.json({
      route: POLICY_CONSENTS_ROUTE,
      policy_consents,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('POLICY_VERSION_CONFLICT')) {
      return Response.json({ errorCode: VERSION_CONFLICT }, { status: 409 });
    }

    return Response.json({ errorCode: POLICY_UPDATE_FAILED }, { status: 500 });
  }
}

