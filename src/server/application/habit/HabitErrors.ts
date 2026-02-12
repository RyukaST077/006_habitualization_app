export type HabitDomainErrorCode =
  | 'INVALID_HABIT_INPUT'
  | 'FORBIDDEN'
  | 'DOMAIN_CONFLICT'
  | 'HABIT_NOT_FOUND'
  | 'INTERNAL_ERROR';

export class HabitDomainError extends Error {
  constructor(
    public readonly code: HabitDomainErrorCode,
    message = code,
  ) {
    super(message);
    this.name = 'HabitDomainError';
  }
}

function createHabitDomainError(
  code: HabitDomainErrorCode,
  message: string,
): HabitDomainError {
  return new HabitDomainError(code, message);
}

export function invalidHabitInput(message = 'INVALID_HABIT_INPUT'): HabitDomainError {
  return createHabitDomainError('INVALID_HABIT_INPUT', message);
}

export function forbiddenHabitAction(message = 'FORBIDDEN'): HabitDomainError {
  return createHabitDomainError('FORBIDDEN', message);
}

export function domainConflict(message = 'DOMAIN_CONFLICT'): HabitDomainError {
  return createHabitDomainError('DOMAIN_CONFLICT', message);
}
