import { describe, expect, test } from 'vitest';

import { createIntegrationClient, hasIntegrationEnv, probeSupabaseConnection } from './setup';

describe('supabase integration setup', () => {
  if (!hasIntegrationEnv()) {
    test.skip('checks staging DB connectivity via Supabase REST endpoint', () => {
      // Skip when integration secrets are not configured in local/CI env.
    });
  } else {
    test('checks staging DB connectivity via Supabase REST endpoint', async () => {
      createIntegrationClient();
      await expect(probeSupabaseConnection()).resolves.toBeUndefined();
    });
  }
});
