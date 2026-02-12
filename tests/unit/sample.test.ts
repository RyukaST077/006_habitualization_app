import { describe, expect, test } from 'vitest';

import { expectHttpStatus } from '../helpers/assertions';
import { createFixtureUsers } from '../helpers/fixtures';

function add(a: number, b: number): number {
  return a + b;
}

describe('test helper usage', () => {
  test('fixture user data can be reused in tests', () => {
    const fixtures = createFixtureUsers();

    expect(fixtures.USER_A.id).toBe('user-a');
    expect(fixtures.USER_B.locale).toBe('en-US');
    expect(fixtures.OPS_1.role).toBe('OPS');
  });

  test('fixture factory returns fresh objects per call', () => {
    const first = createFixtureUsers();
    const second = createFixtureUsers();

    expect(first).not.toBe(second);
    expect(first.USER_A).not.toBe(second.USER_A);
    expect(first.USER_B).not.toBe(second.USER_B);
    expect(first.OPS_1).not.toBe(second.OPS_1);

    first.USER_A.locale = 'fr-FR';
    expect(second.USER_A.locale).toBe('ja-JP');
  });

  test('shared assertions can be reused in tests', () => {
    expect(add(2, 3)).toBe(5);
    expectHttpStatus(200, 200);
  });
});
