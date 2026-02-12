import { describe, expect, it } from 'vitest';

type ResolveLogDate = (nowUtc: Date, timezone: string, cutoffTime: string) => string;

async function loadResolveLogDate(): Promise<ResolveLogDate> {
  const module = await import('../../../src/server/domain/time/BusinessDateService');
  const fn = module.resolveLogDate as ResolveLogDate | undefined;
  if (typeof fn !== 'function') {
    throw new Error('resolveLogDate is not implemented');
  }
  return fn;
}

describe('M-004 BusinessDateService contract (T-042 Red)', () => {
  it('TC-UT-FR-010-001: localTime < cutoff then previous business date', async () => {
    const resolveLogDate = await loadResolveLogDate();
    const actual = resolveLogDate(new Date('2026-02-12T17:59:00.000Z'), 'Asia/Tokyo', '03:00');
    expect(actual).toBe('2026-02-12');
  });

  it('TC-UT-FR-010-002: localTime == cutoff then current business date', async () => {
    const resolveLogDate = await loadResolveLogDate();
    const actual = resolveLogDate(new Date('2026-02-12T18:00:00.000Z'), 'Asia/Tokyo', '03:00');
    expect(actual).toBe('2026-02-13');
  });

  it('covers 00:00 and 23:59 boundary around cutoff', async () => {
    const resolveLogDate = await loadResolveLogDate();

    const midnight = resolveLogDate(new Date('2026-02-12T15:00:00.000Z'), 'Asia/Tokyo', '00:00');
    expect(midnight).toBe('2026-02-13');

    const before2359 = resolveLogDate(new Date('2026-02-13T14:58:00.000Z'), 'Asia/Tokyo', '23:59');
    expect(before2359).toBe('2026-02-12');

    const at2359 = resolveLogDate(new Date('2026-02-13T14:59:00.000Z'), 'Asia/Tokyo', '23:59');
    expect(at2359).toBe('2026-02-13');
  });
});
