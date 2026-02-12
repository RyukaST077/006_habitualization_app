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

// Auth/consent guard behavior is implemented in T-013.
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

export const HOME_TRANSITION_LINKS: TransitionLink[] = [
  {
    from: 'SCR-002',
    to: 'SCR-003',
    label: 'SCR-003 習慣作成へ',
    href: resolveNormalTransitionPath({ from: 'SCR-002', to: 'SCR-003' }),
  },
  {
    from: 'SCR-002',
    to: 'SCR-004',
    label: 'SCR-004 習慣編集へ',
    href: resolveNormalTransitionPath({
      from: 'SCR-002',
      to: 'SCR-004',
      params: { habitId: DEFAULT_EDIT_HABIT_ID },
    }),
  },
  {
    from: 'SCR-002',
    to: 'SCR-005',
    label: 'SCR-005 履歴へ',
    href: resolveNormalTransitionPath({ from: 'SCR-002', to: 'SCR-005' }),
  },
  {
    from: 'SCR-002',
    to: 'SCR-006',
    label: 'SCR-006 分析へ',
    href: resolveNormalTransitionPath({ from: 'SCR-002', to: 'SCR-006' }),
  },
  {
    from: 'SCR-002',
    to: 'SCR-007',
    label: 'SCR-007 設定へ',
    href: resolveNormalTransitionPath({ from: 'SCR-002', to: 'SCR-007' }),
  },
];

export const POLICY_CONSENT_TRANSITION: TransitionLink = {
  from: 'SCR-008',
  to: 'SCR-002',
  label: 'SCR-002 ホームへ',
  href: resolveNormalTransitionPath({ from: 'SCR-008', to: 'SCR-002' }),
};
