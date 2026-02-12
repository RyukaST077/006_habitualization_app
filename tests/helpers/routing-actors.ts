export type RoutingActorState =
  | 'unauthenticated'
  | 'authenticated_without_consent'
  | 'authenticated_with_consent';

export type RoutingActor = {
  actorId: string;
  state: RoutingActorState;
  hasSession: boolean;
  hasConsented: boolean;
};

export type GuardTransitionCase = {
  caseId: string;
  fromScr: 'SCR-002' | 'SCR-008';
  requestedPath: '/home' | '/policy-consent';
  expectedPath: '/login' | '/policy-consent' | '/home';
  requiresSessionDestroy: boolean;
  actor: RoutingActor;
  traceability: string[];
};

export const ROUTING_ACTORS = {
  UNAUTHENTICATED: {
    actorId: 'actor-unauthenticated',
    state: 'unauthenticated',
    hasSession: false,
    hasConsented: false,
  } satisfies RoutingActor,
  AUTHENTICATED_WITHOUT_CONSENT: {
    actorId: 'actor-auth-without-consent',
    state: 'authenticated_without_consent',
    hasSession: true,
    hasConsented: false,
  } satisfies RoutingActor,
  AUTHENTICATED_WITH_CONSENT: {
    actorId: 'actor-auth-with-consent',
    state: 'authenticated_with_consent',
    hasSession: true,
    hasConsented: true,
  } satisfies RoutingActor,
};

export const AUTH_CONSENT_GUARD_CASES: GuardTransitionCase[] = [
  {
    caseId: 'TC-IT-FR-003-002-UNAUTH-HOME',
    fromScr: 'SCR-002',
    requestedPath: '/home',
    expectedPath: '/login',
    requiresSessionDestroy: false,
    actor: ROUTING_ACTORS.UNAUTHENTICATED,
    traceability: ['TC-IT-FR-003-002', 'SCR-002', 'SCR-001', 'FNC-001'],
  },
  {
    caseId: 'TC-IT-FR-003-002-UNCONSENTED-HOME',
    fromScr: 'SCR-002',
    requestedPath: '/home',
    expectedPath: '/policy-consent',
    requiresSessionDestroy: false,
    actor: ROUTING_ACTORS.AUTHENTICATED_WITHOUT_CONSENT,
    traceability: ['TC-IT-FR-003-002', 'SCR-002', 'SCR-008', 'FNC-002'],
  },
  {
    caseId: 'TC-ST-FR-004-004-CONSENT-REJECT',
    fromScr: 'SCR-008',
    requestedPath: '/policy-consent',
    expectedPath: '/login',
    requiresSessionDestroy: true,
    actor: ROUTING_ACTORS.AUTHENTICATED_WITHOUT_CONSENT,
    traceability: ['TC-ST-FR-004-004', 'SCR-008', 'SCR-001', 'FNC-002'],
  },
  {
    caseId: 'TC-IT-FR-002-001-CONSENTED-HOME',
    fromScr: 'SCR-002',
    requestedPath: '/home',
    expectedPath: '/home',
    requiresSessionDestroy: false,
    actor: ROUTING_ACTORS.AUTHENTICATED_WITH_CONSENT,
    traceability: ['TC-IT-FR-002-001', 'SCR-001', 'SCR-002', 'FNC-001', 'FNC-002'],
  },
];
