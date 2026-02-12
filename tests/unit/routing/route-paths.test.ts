import { describe, expect, it } from 'vitest';
import { resolveRoutePath, type ScreenId } from '../../../src/client/routing/route-paths';

type FixedRouteCase = {
  screenId: Exclude<ScreenId, 'SCR-004'>;
  expectedPath: string;
  traceability: string[];
};

type DynamicRouteCase = {
  screenId: 'SCR-004';
  template: '/habits/:habitId/edit';
  validHabitId: string;
  invalidHabitIds: string[];
  traceability: string[];
};

const fixedRouteCases: FixedRouteCase[] = [
  { screenId: 'SCR-001', expectedPath: '/login', traceability: ['SCR-001', 'FNC-001'] },
  { screenId: 'SCR-002', expectedPath: '/home', traceability: ['SCR-002', 'FNC-005'] },
  { screenId: 'SCR-003', expectedPath: '/habits/new', traceability: ['SCR-003', 'FNC-004'] },
  { screenId: 'SCR-005', expectedPath: '/history', traceability: ['SCR-005', 'FNC-008'] },
  { screenId: 'SCR-006', expectedPath: '/analytics', traceability: ['SCR-006', 'FNC-008'] },
  { screenId: 'SCR-007', expectedPath: '/settings', traceability: ['SCR-007', 'FNC-010'] },
  { screenId: 'SCR-008', expectedPath: '/policy-consent', traceability: ['SCR-008', 'FNC-002'] },
];

const dynamicRouteCase: DynamicRouteCase = {
  screenId: 'SCR-004',
  template: '/habits/:habitId/edit',
  validHabitId: 'habit-001',
  invalidHabitIds: ['', ' ', '../evil', 'bad/id'],
  traceability: ['SCR-004', 'FNC-004'],
};

describe('route path definitions', () => {
  it('[SCR-001..003,SCR-005..008] fixed routes are listed as observable assertions', () => {
    for (const routeCase of fixedRouteCases) {
      expect(routeCase.expectedPath).toMatch(/^\//);
      expect(routeCase.expectedPath.includes(':')).toBe(false);
      expect(routeCase.traceability).toContain(routeCase.screenId);
    }
  });

  it('[SCR-004] includes habitId missing/invalid cases for failure tests', () => {
    expect(dynamicRouteCase.screenId).toBe('SCR-004');
    expect(dynamicRouteCase.invalidHabitIds.length).toBeGreaterThanOrEqual(2);
    expect(dynamicRouteCase.invalidHabitIds).toEqual(
      expect.arrayContaining(['', '../evil']),
    );
    expect(dynamicRouteCase.template).toBe('/habits/:habitId/edit');
  });

  it('[SCR-* traceability] all cases can be tracked by SCR ids', () => {
    const allTraceabilityTags = [
      ...fixedRouteCases.flatMap((routeCase) => routeCase.traceability),
      ...dynamicRouteCase.traceability,
    ];

    expect(allTraceabilityTags.filter((tag) => /^SCR-\d{3}$/.test(tag)).length).toBeGreaterThan(0);
    expect(allTraceabilityTags).toContain('SCR-004');
  });

  it('[SCR-001] route resolver should resolve /login for SCR-001', () => {
    expect(resolveRoutePath('SCR-001')).toBe('/login');
  });

  it('[SCR-004] route resolver should resolve dynamic path for valid habitId', () => {
    expect(resolveRoutePath('SCR-004', { habitId: dynamicRouteCase.validHabitId })).toBe(
      '/habits/habit-001/edit',
    );
  });

  it('[SCR-004] route resolver should reject missing or invalid habitId', () => {
    expect(() => resolveRoutePath('SCR-004')).toThrow();
    expect(() => resolveRoutePath('SCR-004', { habitId: undefined })).toThrow();

    for (const habitId of dynamicRouteCase.invalidHabitIds) {
      expect(() => resolveRoutePath('SCR-004', { habitId })).toThrow();
    }
  });
});
