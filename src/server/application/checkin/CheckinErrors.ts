export type CheckinErrorCode =
  | 'VALIDATION_ERROR'
  | 'FORBIDDEN'
  | 'DOMAIN_CONFLICT'
  | 'CHECKIN_CANCEL_NOT_ALLOWED'
  | 'INTERNAL_ERROR'
  | 'HABIT_ARCHIVED';

export class CheckinDomainError extends Error {
  constructor(
    public readonly code: CheckinErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = 'CheckinDomainError';
  }
}

function createDomainError(
  code: CheckinErrorCode,
  message: string,
): CheckinDomainError {
  return new CheckinDomainError(code, message);
}

export function isCheckinDomainError(error: unknown): error is CheckinDomainError {
  return error instanceof Error && error.name === 'CheckinDomainError';
}

export function validationError(message: string): CheckinDomainError {
  return createDomainError('VALIDATION_ERROR', message);
}

export function forbiddenError(message: string): CheckinDomainError {
  return createDomainError('FORBIDDEN', message);
}

export function domainConflictError(message: string): CheckinDomainError {
  return createDomainError('DOMAIN_CONFLICT', message);
}

export function checkinCancelNotAllowedError(message: string): CheckinDomainError {
  return createDomainError('CHECKIN_CANCEL_NOT_ALLOWED', message);
}

export function internalError(message: string): CheckinDomainError {
  return createDomainError('INTERNAL_ERROR', message);
}

export function habitArchivedError(message: string): CheckinDomainError {
  return createDomainError('HABIT_ARCHIVED', message);
}
