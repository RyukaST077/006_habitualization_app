import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadMigrationSql } from '../helpers/db/migration-runner';
import { createFixtureUsers, type FixtureUsers } from '../helpers/fixtures';

type IntegrationEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  targetEnv: string;
};

const PROD_ENV_NAMES = new Set(['prod', 'production']);

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function parseIntegrationEnv(env: NodeJS.ProcessEnv = process.env): IntegrationEnv {
  const supabaseUrl = env.SUPABASE_URL?.trim() ?? '';
  const supabaseAnonKey = env.SUPABASE_ANON_KEY?.trim() ?? '';
  const targetEnv = env.SUPABASE_ENV?.trim() ?? '';

  const missing: string[] = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
  if (!targetEnv) missing.push('SUPABASE_ENV');

  if (missing.length > 0) {
    throw new Error(
      `[IT-SETUP] Missing required environment variables: ${missing.join(', ')}. ` +
        'Set staging values before running npm run test.',
    );
  }

  return { supabaseUrl, supabaseAnonKey, targetEnv };
}

export function hasIntegrationEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env.SUPABASE_URL?.trim() && env.SUPABASE_ANON_KEY?.trim() && env.SUPABASE_ENV?.trim(),
  );
}

function assertNotProductionTarget({ supabaseUrl, targetEnv }: IntegrationEnv): void {
  const normalizedEnv = normalize(targetEnv);
  if (PROD_ENV_NAMES.has(normalizedEnv)) {
    throw new Error(
      `[IT-SETUP] Production environment is forbidden for tests. SUPABASE_ENV=${targetEnv}`,
    );
  }

  const normalizedUrl = normalize(supabaseUrl);
  if (normalizedUrl.includes('prod') || normalizedUrl.includes('production')) {
    throw new Error(
      `[IT-SETUP] Production-like URL is forbidden for tests. SUPABASE_URL=${supabaseUrl}`,
    );
  }
}

export function createIntegrationClient(env: NodeJS.ProcessEnv = process.env): SupabaseClient {
  const parsed = parseIntegrationEnv(env);
  assertNotProductionTarget(parsed);

  return createClient(parsed.supabaseUrl, parsed.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function initializeIntegrationFixtures(): FixtureUsers {
  return createFixtureUsers();
}

export async function probeSupabaseConnection(env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const parsed = parseIntegrationEnv(env);
  assertNotProductionTarget(parsed);

  const probeUrl = new URL('/rest/v1/', parsed.supabaseUrl).toString();
  const response = await fetch(probeUrl, {
    method: 'GET',
    headers: {
      apikey: parsed.supabaseAnonKey,
      Authorization: `Bearer ${parsed.supabaseAnonKey}`,
    },
  }).catch((error: unknown) => {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`[IT-SETUP] Connectivity probe failed for ${probeUrl}: ${reason}`);
  });

  if (response.status >= 500) {
    throw new Error(
      `[IT-SETUP] Connectivity probe returned server error: ${response.status} ${response.statusText}`,
    );
  }
}

export function loadCoreMigrationSql(): string {
  return loadMigrationSql();
}

export function loadIntegrationMigrationSql(): string {
  return loadMigrationSql();
}

export function loadPolicyAuditMigrationSql(): string {
  return loadMigrationSql();
}

export function loadAggregationWithdrawalAlertMigrationSql(): string {
  return loadMigrationSql();
}

export function loadAggregationWithdrawalAlertIntegrationMigrationSql(): string {
  return loadMigrationSql();
}

export const AGGREGATION_WITHDRAWAL_ALERT_DDL_TEST_GLOBS = [
  'tests/integration/db/*withdrawal*.test.ts',
  'tests/integration/db/*aggregation*.test.ts',
  'tests/integration/db/*alert*.test.ts',
] as const;

export const REPOSITORY_CONTRACT_TEST_GLOBS = [
  'tests/integration/repositories/*.test.ts',
] as const;

export const IF002_CONTRACT_TEST_GLOBS = [
  'tests/integration/api/*.test.ts',
] as const;

export const FNC013_CONTRACT_TEST_GLOBS = [
  'tests/integration/db/fnc013-rls-policy.contract.test.ts',
  'tests/integration/security/fnc013-authorization-policy.contract.test.ts',
  'tests/integration/security/fnc013-red-summary.test.ts',
] as const;

export const T030_CONTRACT_TEST_GLOBS = [
  'tests/integration/security/common-error.contract.test.ts',
  'tests/integration/security/audit-assertions.contract.test.ts',
  'tests/integration/security/t030-red-summary.test.ts',
] as const;

export const T033_CONTRACT_TEST_GLOBS = [
  'tests/integration/routing/auth-callback-logout.contract.test.ts',
  'tests/integration/routing/auth-usecase.contract.test.ts',
  'tests/integration/routing/t033-red-summary.test.ts',
] as const;
