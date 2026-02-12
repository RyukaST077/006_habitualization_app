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
