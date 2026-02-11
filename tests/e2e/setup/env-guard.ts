import type { FullConfig } from '@playwright/test';

const PROD_ENV_NAMES = new Set(['prod', 'production']);
const REQUIRED_ENV_KEYS = ['SUPABASE_ENV', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function isSmokeGuardEnabled(): boolean {
  const flag = process.env.E2E_SMOKE_GUARD ?? '';
  return flag === '1' || normalize(flag) === 'true';
}

function collectMissingKeys(): string[] {
  return REQUIRED_ENV_KEYS.filter((key) => {
    const value = process.env[key];
    return !value || value.trim() === '';
  });
}

function assertNotProduction(): void {
  const supabaseEnv = process.env.SUPABASE_ENV?.trim() ?? '';
  const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? '';

  if (PROD_ENV_NAMES.has(normalize(supabaseEnv))) {
    throw new Error(
      `[E2E-GUARD] Production environment is forbidden for smoke tests. SUPABASE_ENV=${supabaseEnv}`,
    );
  }

  const normalizedUrl = normalize(supabaseUrl);
  if (normalizedUrl.includes('prod') || normalizedUrl.includes('production')) {
    throw new Error(
      `[E2E-GUARD] Production-like URL is forbidden for smoke tests. SUPABASE_URL=${supabaseUrl}`,
    );
  }
}

export default async function globalSetup(_: FullConfig): Promise<void> {
  if (!isSmokeGuardEnabled()) {
    return;
  }

  const missing = collectMissingKeys();
  if (missing.length > 0) {
    throw new Error(
      `[E2E-GUARD] Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  assertNotProduction();
}
