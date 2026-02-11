import { describe, expect, test } from 'vitest';

function add(a: number, b: number): number {
  return a + b;
}

describe('add', () => {
  test('2 + 3 equals 5', () => {
    expect(add(2, 3)).toBe(5);
  });
});
