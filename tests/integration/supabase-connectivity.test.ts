import { describe, expect, test } from 'vitest';

import { createIntegrationClient, probeSupabaseConnection } from './setup';

describe('supabase integration setup', () => {
  test('checks staging DB connectivity via Supabase REST endpoint', async () => {
    createIntegrationClient();
    await expect(probeSupabaseConnection()).resolves.toBeUndefined();
  });
});
