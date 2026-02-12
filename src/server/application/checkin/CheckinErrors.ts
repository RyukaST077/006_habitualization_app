export type CheckinErrorCode =
  | 'VALIDATION_ERROR'
  | 'FORBIDDEN'
  | 'DOMAIN_CONFLICT'
  | 'INTERNAL_ERROR'
  | 'HABIT_ARCHIVED';

export class CheckinDomainError extends Error {
  constructor(
    public readonly code: CheckinErrorCode,
    message = code,
  ) {
    super(message);
    this.name = 'CheckinDomainError';
  }
}

function createCheckinError(
  code: CheckinErrorCode,
  message: string,
): CheckinDomainError {
  return new CheckinDomainError(code, message);
}

export function validationError(message: string): CheckinDomainError {
  return createCheckinError('VALIDATION_ERROR', message);
}

export function forbiddenError(message: string): CheckinDomainError {
  return createCheckinError('FORBIDDEN', message);
}

export function domainConflictError(message: string): CheckinDomainError {
  return createCheckinError('DOMAIN_CONFLICT', message);
}

export function internalError(message: string): CheckinDomainError {
  return createCheckinError('INTERNAL_ERROR', message);
}

export function habitArchivedError(message: string): CheckinDomainError {
  return createCheckinError('HABIT_ARCHIVED', message);
}
