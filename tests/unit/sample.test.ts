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

  test('shared assertions can be reused in tests', () => {
    expect(add(2, 3)).toBe(5);
    expectHttpStatus(200, 200);
  });
});
