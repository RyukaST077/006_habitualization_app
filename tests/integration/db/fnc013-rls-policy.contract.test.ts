import { describe, it } from 'vitest';

import { expectRlsKeywords, loadFnc013Sql } from '../../helpers/db/fnc013-rls-assertions';

describe('FNC-013 RLS SQL contract (Red)', () => {
  it('defines dedicated RLS SQL with enable row level security and auth.uid scope', () => {
    const sql = loadFnc013Sql('src/server/authz/sql/fnc013-rls.sql');
    expect(sql).toContain('enable row level security');
    expect(sql).toContain('auth.uid() = user_id');
    expect(sql).toContain('FORBIDDEN');
    expectRlsKeywords(sql);
  });
});
