export type AppErrorCode = 'FORBIDDEN' | 'INTERNAL_ERROR' | 'VALIDATION_ERROR' | 'DOMAIN_CONFLICT';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly trace_id: string;

  constructor(code: AppErrorCode, message: string, traceId: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.trace_id = traceId;
  }
}
