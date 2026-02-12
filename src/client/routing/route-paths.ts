export type ScreenId =
  | 'SCR-001'
  | 'SCR-002'
  | 'SCR-003'
  | 'SCR-004'
  | 'SCR-005'
  | 'SCR-006'
  | 'SCR-007'
  | 'SCR-008';

export type ResolveRouteParams = {
  habitId?: string;
};

const FIXED_ROUTE_PATHS: Record<Exclude<ScreenId, 'SCR-004'>, string> = {
  'SCR-001': '/login',
  'SCR-002': '/home',
  'SCR-003': '/habits/new',
  'SCR-005': '/history',
  'SCR-006': '/analytics',
  'SCR-007': '/settings',
  'SCR-008': '/policy-consent',
};

const HABIT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

function assertValidHabitId(habitId: string | undefined): string {
  if (habitId === undefined) {
    throw new Error('habitId is required for SCR-004');
  }

  if (habitId.trim().length === 0) {
    throw new Error('habitId must not be blank');
  }

  if (!HABIT_ID_PATTERN.test(habitId)) {
    throw new Error('habitId contains invalid characters');
  }

  return habitId;
}

export function resolveRoutePath(screenId: ScreenId, params?: ResolveRouteParams): string {
  if (screenId === 'SCR-004') {
    const habitId = assertValidHabitId(params?.habitId);
    return `/habits/${habitId}/edit`;
  }

  return FIXED_ROUTE_PATHS[screenId];
}
