export type AppErrorCode = "FORBIDDEN" | "DOMAIN_CONFLICT" | "INTERNAL_ERROR" | (string & {});

export interface AppErrorInput {
  code: AppErrorCode;
  message: string;
  requirementId: string;
  traceId: string;
}

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly requirementId: string;
  public readonly traceId: string;

  public constructor(input: AppErrorInput) {
    super(input.message);
    this.name = "AppError";
    this.code = input.code;
    this.requirementId = input.requirementId;
    this.traceId = input.traceId;
  }
}

export function createAppError(input: AppErrorInput): AppError {
  return new AppError(input);
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
