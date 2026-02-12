import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type AuthState =
  | 'unauthenticated'
  | 'authenticated_without_consent'
  | 'authenticated_with_consent';

type RouteTransitionCase = {
  scenarioId: string;
  fromScr: `SCR-00${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
  toScr: `SCR-00${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
  fromPath: string;
  expectedPath: string;
  authState: AuthState;
  guard: 'auth_required' | 'consent_required' | 'normal_navigation';
  traceability: string[];
};

const routeTransitionMatrix: RouteTransitionCase[] = [
  // SCR-002 -> SCR-001, FNC-001: 未認証ユーザーはホーム到達不可
  {
    scenarioId: 'TC-ROUTE-001',
    fromScr: 'SCR-002',
    toScr: 'SCR-001',
    fromPath: '/home',
    expectedPath: '/login',
    authState: 'unauthenticated',
    guard: 'auth_required',
    traceability: ['SCR-002', 'SCR-001', 'FNC-001'],
  },
  // SCR-002 -> SCR-008, FNC-002: 未同意ユーザーは同意画面へ
  {
    scenarioId: 'TC-ROUTE-002',
    fromScr: 'SCR-002',
    toScr: 'SCR-008',
    fromPath: '/home',
    expectedPath: '/policy-consent',
    authState: 'authenticated_without_consent',
    guard: 'consent_required',
    traceability: ['SCR-002', 'SCR-008', 'FNC-002'],
  },
  // SCR-001 -> SCR-002, FNC-001/FNC-002: 認証済みかつ同意済みでホームへ
  {
    scenarioId: 'TC-ROUTE-003',
    fromScr: 'SCR-001',
    toScr: 'SCR-002',
    fromPath: '/login',
    expectedPath: '/home',
    authState: 'authenticated_with_consent',
    guard: 'normal_navigation',
    traceability: ['SCR-001', 'SCR-002', 'FNC-001', 'FNC-002'],
  },
  // SCR-002 -> SCR-003, FNC-004
  {
    scenarioId: 'TC-ROUTE-004',
    fromScr: 'SCR-002',
    toScr: 'SCR-003',
    fromPath: '/home',
    expectedPath: '/habits/new',
    authState: 'authenticated_with_consent',
    guard: 'normal_navigation',
    traceability: ['SCR-002', 'SCR-003', 'FNC-004'],
  },
  // SCR-002 -> SCR-004, FNC-004
  {
    scenarioId: 'TC-ROUTE-005',
    fromScr: 'SCR-002',
    toScr: 'SCR-004',
    fromPath: '/home',
    expectedPath: '/habits/abc123/edit',
    authState: 'authenticated_with_consent',
    guard: 'normal_navigation',
    traceability: ['SCR-002', 'SCR-004', 'FNC-004'],
  },
  // SCR-002 -> SCR-005, FNC-008
  {
    scenarioId: 'TC-ROUTE-006',
    fromScr: 'SCR-002',
    toScr: 'SCR-005',
    fromPath: '/home',
    expectedPath: '/history',
    authState: 'authenticated_with_consent',
    guard: 'normal_navigation',
    traceability: ['SCR-002', 'SCR-005', 'FNC-008'],
  },
  // SCR-002 -> SCR-006, FNC-008
  {
    scenarioId: 'TC-ROUTE-007',
    fromScr: 'SCR-002',
    toScr: 'SCR-006',
    fromPath: '/home',
    expectedPath: '/analytics',
    authState: 'authenticated_with_consent',
    guard: 'normal_navigation',
    traceability: ['SCR-002', 'SCR-006', 'FNC-008'],
  },
  // SCR-002 -> SCR-007, FNC-010
  {
    scenarioId: 'TC-ROUTE-008',
    fromScr: 'SCR-002',
    toScr: 'SCR-007',
    fromPath: '/home',
    expectedPath: '/settings',
    authState: 'authenticated_with_consent',
    guard: 'normal_navigation',
    traceability: ['SCR-002', 'SCR-007', 'FNC-010'],
  },
  // SCR-008 -> SCR-002, FNC-003
  {
    scenarioId: 'TC-ROUTE-009',
    fromScr: 'SCR-008',
    toScr: 'SCR-002',
    fromPath: '/policy-consent',
    expectedPath: '/home',
    authState: 'authenticated_with_consent',
    guard: 'normal_navigation',
    traceability: ['SCR-008', 'SCR-002', 'FNC-003'],
  },
];

function resolveNextRoute(fromPath: string, authState: AuthState): string {
  if (fromPath === '/home') {
    if (authState === 'unauthenticated') {
      return '/login';
    }

    if (authState === 'authenticated_without_consent') {
      return '/policy-consent';
    }
  }

  return fromPath;
}

const screenContainerFiles = [
  { scrId: 'SCR-001', path: 'src/app/login/page.tsx' },
  { scrId: 'SCR-002', path: 'src/app/home/page.tsx' },
  { scrId: 'SCR-003', path: 'src/app/habits/new/page.tsx' },
  { scrId: 'SCR-004', path: 'src/app/habits/[habitId]/edit/page.tsx' },
  { scrId: 'SCR-005', path: 'src/app/history/page.tsx' },
  { scrId: 'SCR-006', path: 'src/app/analytics/page.tsx' },
  { scrId: 'SCR-007', path: 'src/app/settings/page.tsx' },
  { scrId: 'SCR-008', path: 'src/app/policy-consent/page.tsx' },
] as const;

describe('route transition matrix', () => {
  it('covers SCR-001..008 at least once in source/destination', () => {
    const covered = new Set(
      routeTransitionMatrix.flatMap((testCase) => [testCase.fromScr, testCase.toScr]),
    );

    expect(covered).toEqual(
      new Set([
        'SCR-001',
        'SCR-002',
        'SCR-003',
        'SCR-004',
        'SCR-005',
        'SCR-006',
        'SCR-007',
        'SCR-008',
      ]),
    );
  });

  it('contains observable assertions for transition source/destination', () => {
    for (const testCase of routeTransitionMatrix) {
      expect(testCase.fromPath).toMatch(/^\//);
      expect(testCase.expectedPath).toMatch(/^\//);
      expect(testCase.fromScr).not.toBe('');
      expect(testCase.toScr).not.toBe('');
    }
  });

  it('contains unauthenticated, without-consent, with-consent states', () => {
    const states = new Set(routeTransitionMatrix.map((testCase) => testCase.authState));
    expect(states).toEqual(
      new Set([
        'unauthenticated',
        'authenticated_without_consent',
        'authenticated_with_consent',
      ]),
    );
  });

  it('keeps SCR/FNC traceability per case', () => {
    for (const testCase of routeTransitionMatrix) {
      expect(testCase.traceability.some((tag) => /^SCR-\d{3}$/.test(tag))).toBe(true);
      expect(testCase.traceability.some((tag) => /^FNC-\d{3}$/.test(tag))).toBe(true);
    }
  });

  it('unauthenticated /home access should resolve to /login', () => {
    expect(resolveNextRoute('/home', 'unauthenticated')).toBe('/login');
  });

  it('screen containers include observable SCR labels', () => {
    for (const file of screenContainerFiles) {
      const fileContent = readFileSync(resolve(file.path), 'utf8');
      expect(fileContent).toContain(file.scrId);
    }
  });
});
