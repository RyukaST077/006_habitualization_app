export type SmokeUserKey = 'USER_A' | 'USER_B' | 'OPS_1';

export type SmokeUser = {
  key: SmokeUserKey;
  displayName: string;
  // ROLE-001: general users (USER_A/USER_B), ROLE-002: ops user (OPS_1)
  roleCode: 'ROLE-001' | 'ROLE-002';
  envEmailKey: 'E2E_USER_A_EMAIL' | 'E2E_USER_B_EMAIL' | 'E2E_OPS_1_EMAIL';
  // NOTE: Non-secret placeholder only. Real credentials must come from CI secrets.
  email: string;
};

// Naming rule: use USER_A / USER_B / OPS_1 as fixed fixture keys across UT/IT/E2E.
const DEFAULT_SMOKE_EMAILS: Record<SmokeUserKey, string> = {
  USER_A: 'user-a-smoke@example.invalid',
  USER_B: 'user-b-smoke@example.invalid',
  OPS_1: 'ops-1-smoke@example.invalid',
};

const E2E_EMAIL_ENV_BY_USER: Record<
  SmokeUserKey,
  'E2E_USER_A_EMAIL' | 'E2E_USER_B_EMAIL' | 'E2E_OPS_1_EMAIL'
> = {
  USER_A: 'E2E_USER_A_EMAIL',
  USER_B: 'E2E_USER_B_EMAIL',
  OPS_1: 'E2E_OPS_1_EMAIL',
};

function resolveFixtureEmail(key: SmokeUserKey): string {
  const envKey = E2E_EMAIL_ENV_BY_USER[key];
  const envValue = process.env[envKey]?.trim();
  return envValue && envValue.length > 0 ? envValue : DEFAULT_SMOKE_EMAILS[key];
}

export const smokeUsers: Record<SmokeUserKey, SmokeUser> = {
  USER_A: {
    key: 'USER_A',
    displayName: 'Smoke User A',
    roleCode: 'ROLE-001',
    envEmailKey: 'E2E_USER_A_EMAIL',
    email: resolveFixtureEmail('USER_A'),
  },
  USER_B: {
    key: 'USER_B',
    displayName: 'Smoke User B',
    roleCode: 'ROLE-001',
    envEmailKey: 'E2E_USER_B_EMAIL',
    email: resolveFixtureEmail('USER_B'),
  },
  OPS_1: {
    key: 'OPS_1',
    displayName: 'Smoke Ops 1',
    roleCode: 'ROLE-002',
    envEmailKey: 'E2E_OPS_1_EMAIL',
    email: resolveFixtureEmail('OPS_1'),
  },
};

export type AuthBackendPolicy = {
  supabaseEnv: string;
  mode: 'dev-mock' | 'stg-live';
  note: string;
};

// IF-001 policy: Dev allows mock auth, Stg requires real integration.
export function resolveAuthBackendPolicy(): AuthBackendPolicy {
  const supabaseEnv = (process.env.SUPABASE_ENV ?? 'dev').toLowerCase();

  if (supabaseEnv === 'stg') {
    return {
      supabaseEnv,
      mode: 'stg-live',
      note: 'Use real /api/auth/google/start and validate IF-001 responses.',
    };
  }

  return {
    supabaseEnv,
    mode: 'dev-mock',
    note: 'Use mocked identity provider flow in development smoke runs.',
  };
}
