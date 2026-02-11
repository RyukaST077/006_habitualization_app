export type SmokeUserKey = 'USER_A' | 'USER_B' | 'OPS_1';

export type SmokeUser = {
  key: SmokeUserKey;
  displayName: string;
  // NOTE: Non-secret placeholder only. Real credentials must come from CI secrets.
  email: string;
};

export const smokeUsers: Record<SmokeUserKey, SmokeUser> = {
  USER_A: {
    key: 'USER_A',
    displayName: 'Smoke User A',
    email: process.env.E2E_USER_A_EMAIL ?? 'user-a-smoke@example.invalid',
  },
  USER_B: {
    key: 'USER_B',
    displayName: 'Smoke User B',
    email: process.env.E2E_USER_B_EMAIL ?? 'user-b-smoke@example.invalid',
  },
  OPS_1: {
    key: 'OPS_1',
    displayName: 'Smoke Ops 1',
    email: process.env.E2E_OPS_1_EMAIL ?? 'ops-1-smoke@example.invalid',
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
