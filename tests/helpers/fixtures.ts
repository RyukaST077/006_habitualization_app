export type FixtureUser = {
  id: string;
  role: 'USER' | 'OPS';
  roleCode: 'ROLE-001' | 'ROLE-002';
  responsibility: 'normal-flow' | 'cross-user-deny' | 'ops-validation';
  email: string;
  timezone: string;
  locale: string;
};

export type FixtureUsers = {
  USER_A: FixtureUser;
  USER_B: FixtureUser;
  OPS_1: FixtureUser;
};

export type AuthConsentFixtureState =
  | 'unauthenticated'
  | 'authenticated_without_consent'
  | 'authenticated_with_consent';

export type AuthConsentFixture = {
  actorId: string;
  state: AuthConsentFixtureState;
  hasSession: boolean;
  hasConsented: boolean;
};

export type AuthConsentFixtures = {
  UNAUTHENTICATED: AuthConsentFixture;
  AUTHENTICATED_WITHOUT_CONSENT: AuthConsentFixture;
  AUTHENTICATED_WITH_CONSENT: AuthConsentFixture;
};

export type AuthState =
  | 'unauthenticated'
  | 'authenticated_without_consent'
  | 'authenticated_with_consent';

export type RouteTransitionCase = {
  scenarioId: string;
  fromScr: `SCR-00${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
  toScr: `SCR-00${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
  fromPath: string;
  expectedPath: string;
  authState: AuthState;
  guard: 'auth_required' | 'consent_required' | 'normal_navigation';
  traceability: string[];
};

export type ScreenContainerFixture = {
  scrId: `SCR-00${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
  path: string;
};

const BASE_USERS: FixtureUsers = {
  // USER_A: normal user for successful self-owned operations.
  USER_A: {
    id: 'user-a',
    role: 'USER',
    roleCode: 'ROLE-001',
    responsibility: 'normal-flow',
    email: 'user.a@example.com',
    timezone: 'Asia/Tokyo',
    locale: 'ja-JP',
  },
  // USER_B: normal user used to verify cross-user access denial.
  USER_B: {
    id: 'user-b',
    role: 'USER',
    roleCode: 'ROLE-001',
    responsibility: 'cross-user-deny',
    email: 'user.b@example.com',
    timezone: 'UTC',
    locale: 'en-US',
  },
  // OPS_1: operations role used for administrative/monitoring verification.
  OPS_1: {
    id: 'ops-1',
    role: 'OPS',
    roleCode: 'ROLE-002',
    responsibility: 'ops-validation',
    email: 'ops.1@example.com',
    timezone: 'Asia/Tokyo',
    locale: 'ja-JP',
  },
};

const BASE_AUTH_CONSENT_FIXTURES: AuthConsentFixtures = {
  UNAUTHENTICATED: {
    actorId: 'actor-unauthenticated',
    state: 'unauthenticated',
    hasSession: false,
    hasConsented: false,
  },
  AUTHENTICATED_WITHOUT_CONSENT: {
    actorId: 'actor-auth-without-consent',
    state: 'authenticated_without_consent',
    hasSession: true,
    hasConsented: false,
  },
  AUTHENTICATED_WITH_CONSENT: {
    actorId: 'actor-auth-with-consent',
    state: 'authenticated_with_consent',
    hasSession: true,
    hasConsented: true,
  },
};

const BASE_ROUTE_TRANSITION_MATRIX: RouteTransitionCase[] = [
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

const BASE_SCREEN_CONTAINER_FIXTURES: ScreenContainerFixture[] = [
  { scrId: 'SCR-001', path: 'src/app/login/page.tsx' },
  { scrId: 'SCR-002', path: 'src/app/home/page.tsx' },
  { scrId: 'SCR-003', path: 'src/app/habits/new/page.tsx' },
  { scrId: 'SCR-004', path: 'src/app/habits/[habitId]/edit/page.tsx' },
  { scrId: 'SCR-005', path: 'src/app/history/page.tsx' },
  { scrId: 'SCR-006', path: 'src/app/analytics/page.tsx' },
  { scrId: 'SCR-007', path: 'src/app/settings/page.tsx' },
  { scrId: 'SCR-008', path: 'src/app/policy-consent/page.tsx' },
];

export function createFixtureUsers(): FixtureUsers {
  return {
    USER_A: { ...BASE_USERS.USER_A },
    USER_B: { ...BASE_USERS.USER_B },
    OPS_1: { ...BASE_USERS.OPS_1 },
  };
}

export function createAuthConsentFixtures(): AuthConsentFixtures {
  return {
    UNAUTHENTICATED: { ...BASE_AUTH_CONSENT_FIXTURES.UNAUTHENTICATED },
    AUTHENTICATED_WITHOUT_CONSENT: { ...BASE_AUTH_CONSENT_FIXTURES.AUTHENTICATED_WITHOUT_CONSENT },
    AUTHENTICATED_WITH_CONSENT: { ...BASE_AUTH_CONSENT_FIXTURES.AUTHENTICATED_WITH_CONSENT },
  };
}

export function createRouteTransitionMatrix(): RouteTransitionCase[] {
  return BASE_ROUTE_TRANSITION_MATRIX.map((entry) => ({
    ...entry,
    traceability: [...entry.traceability],
  }));
}

export function createScreenContainerFixtures(): ScreenContainerFixture[] {
  return BASE_SCREEN_CONTAINER_FIXTURES.map((entry) => ({ ...entry }));
}
