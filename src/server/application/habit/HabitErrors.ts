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

export function invalidHabitInput(message: string): HabitDomainError {
  return new HabitDomainError('INVALID_HABIT_INPUT', message);
}

export function forbiddenHabitAction(message: string): HabitDomainError {
  return new HabitDomainError('FORBIDDEN', message);
}

export function domainConflict(message: string): HabitDomainError {
  return new HabitDomainError('DOMAIN_CONFLICT', message);
}
