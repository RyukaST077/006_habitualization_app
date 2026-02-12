import {
  resolveAuthConsentGuard,
  type AuthConsentGuardActor,
  type ConsentDecision,
  type GuardedPath,
} from './auth-consent-guard';
import { resolveRoutePath, type ResolveRouteParams, type ScreenId } from './route-paths';

export type NormalTransition =
  | { from: 'SCR-002'; to: 'SCR-003' }
  | { from: 'SCR-002'; to: 'SCR-004'; params: { habitId: string } }
  | { from: 'SCR-002'; to: 'SCR-005' }
  | { from: 'SCR-002'; to: 'SCR-006' }
  | { from: 'SCR-002'; to: 'SCR-007' }
  | { from: 'SCR-008'; to: 'SCR-002' };

export type TransitionLink = {
  from: ScreenId;
  to: ScreenId;
  label: string;
  href: string;
};

const DEFAULT_EDIT_HABIT_ID = 'abc123';

export type GuardedTransition = {
  actor: AuthConsentGuardActor;
  requestedPath: GuardedPath;
  decision?: ConsentDecision;
};

// Auth/consent guard behavior is implemented in T-013.
export function resolveGuardedTransitionPath(transition: GuardedTransition): string {
  return resolveAuthConsentGuard(
    transition.actor,
    transition.requestedPath,
    transition.decision,
  ).nextPath;
}

export function resolveNormalTransitionPath(
  transition: NormalTransition,
  params?: ResolveRouteParams,
): string {
  if (transition.from === 'SCR-002' && transition.to === 'SCR-004') {
    const mergedParams = { ...transition.params, ...params };
    return resolveRoutePath('SCR-004', mergedParams);
  }

  return resolveRoutePath(transition.to, params);
}

function createNormalTransitionLink(transition: NormalTransition, label: string): TransitionLink {
  return {
    from: transition.from,
    to: transition.to,
    label,
    href: resolveNormalTransitionPath(transition),
  };
}

export const LOGIN_TO_CONSENT_TRANSITION: TransitionLink = {
  from: 'SCR-001',
  to: 'SCR-008',
  label: 'Googleでログイン',
  href: resolveRoutePath('SCR-008'),
};

const HOME_NORMAL_TRANSITIONS: Array<{
  transition: Extract<NormalTransition, { from: 'SCR-002' }>;
  label: string;
}> = [
  {
    transition: { from: 'SCR-002', to: 'SCR-003' },
    label: 'SCR-003 習慣作成へ',
  },
  {
    transition: {
      from: 'SCR-002',
      to: 'SCR-004',
      params: { habitId: DEFAULT_EDIT_HABIT_ID },
    },
    label: 'SCR-004 習慣編集へ',
  },
  {
    transition: { from: 'SCR-002', to: 'SCR-005' },
    label: 'SCR-005 履歴へ',
  },
  {
    transition: { from: 'SCR-002', to: 'SCR-006' },
    label: 'SCR-006 分析へ（任意機能/モック）',
  },
  {
    transition: { from: 'SCR-002', to: 'SCR-007' },
    label: 'SCR-007 設定へ',
  },
];

export const HOME_TRANSITION_LINKS: TransitionLink[] = HOME_NORMAL_TRANSITIONS.map(({ transition, label }) =>
  createNormalTransitionLink(transition, label),
);

export const POLICY_CONSENT_TRANSITION = createNormalTransitionLink(
  { from: 'SCR-008', to: 'SCR-002' },
  'SCR-002 ホームへ',
);

export const POLICY_REJECT_TRANSITION: TransitionLink = {
  from: 'SCR-008',
  to: 'SCR-001',
  label: 'SCR-001 ログインへ戻る',
  href: resolveRoutePath('SCR-001'),
};
