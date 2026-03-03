export const REPOSITORY_API_ERROR_STATUS = {
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  DOMAIN_CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

export type RepositoryApiErrorCode = keyof typeof REPOSITORY_API_ERROR_STATUS;
export type RepositoryHttpStatus = (typeof REPOSITORY_API_ERROR_STATUS)[RepositoryApiErrorCode];

export const POLICY_VERSION_REPOSITORY_ERROR_CODES = {
  MISMATCH: "POLICY_VERSION_MISMATCH",
  CONFLICT: "POLICY_VERSION_CONFLICT",
} as const;

export const HABIT_REPOSITORY_ERROR_CODES = {
  INVALID_HABIT_INPUT: "INVALID_HABIT_INPUT",
  INVALID_HABIT_STATUS_TRANSITION: "INVALID_HABIT_STATUS_TRANSITION",
  FORBIDDEN: "FORBIDDEN",
} as const;

export const HABIT_REPOSITORY_ERROR_TO_EXCEPTION = {
  [HABIT_REPOSITORY_ERROR_CODES.INVALID_HABIT_INPUT]: "EX-003",
  [HABIT_REPOSITORY_ERROR_CODES.FORBIDDEN]: "EX-004",
} as const;

export const REPOSITORY_ERROR_CODE_TO_API_CODE = {
  [HABIT_REPOSITORY_ERROR_CODES.INVALID_HABIT_INPUT]: "BAD_REQUEST",
  [HABIT_REPOSITORY_ERROR_CODES.FORBIDDEN]: "FORBIDDEN",
  [HABIT_REPOSITORY_ERROR_CODES.INVALID_HABIT_STATUS_TRANSITION]: "DOMAIN_CONFLICT",
  OPTIMISTIC_LOCK_CONFLICT: "DOMAIN_CONFLICT",
  CHECKIN_CONFLICT: "DOMAIN_CONFLICT",
  [POLICY_VERSION_REPOSITORY_ERROR_CODES.MISMATCH]: "DOMAIN_CONFLICT",
  [POLICY_VERSION_REPOSITORY_ERROR_CODES.CONFLICT]: "DOMAIN_CONFLICT",
  UNIQUE_CONFLICT: "DOMAIN_CONFLICT",
  REPOSITORY_ERROR: "INTERNAL_ERROR",
} as const;

export type RepositoryErrorCode = keyof typeof REPOSITORY_ERROR_CODE_TO_API_CODE;

export type RepositoryErrorApiCode<C extends RepositoryErrorCode = RepositoryErrorCode> =
  (typeof REPOSITORY_ERROR_CODE_TO_API_CODE)[C];

export interface RepositoryErrorMeta<C extends RepositoryErrorCode = RepositoryErrorCode> {
  code: C;
  apiCode: RepositoryErrorApiCode<C>;
  status: (typeof REPOSITORY_API_ERROR_STATUS)[RepositoryErrorApiCode<C>];
  message: string;
  cause?: unknown;
}

export class RepositoryDomainError<C extends RepositoryErrorCode = RepositoryErrorCode>
  extends Error
  implements RepositoryErrorMeta<C>
{
  public readonly code: C;
  public readonly apiCode: RepositoryErrorApiCode<C>;
  public readonly status: (typeof REPOSITORY_API_ERROR_STATUS)[RepositoryErrorApiCode<C>];
  public readonly cause?: unknown;

  public constructor(code: C, message: string, cause?: unknown) {
    super(message);
    this.name = "RepositoryDomainError";
    this.code = code;
    this.apiCode = REPOSITORY_ERROR_CODE_TO_API_CODE[code] as RepositoryErrorApiCode<C>;
    this.status = REPOSITORY_API_ERROR_STATUS[this.apiCode];
    this.cause = cause;
  }
}

export function createRepositoryError<C extends RepositoryErrorCode>(
  code: C,
  message: string,
  cause?: unknown,
): RepositoryDomainError<C> {
  return new RepositoryDomainError(code, message, cause);
}
