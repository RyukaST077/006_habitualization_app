export const T030_TRACE_ID_PREFIX = "trace-";

export function createT030TraceId(traceToken: string): string {
  return `${T030_TRACE_ID_PREFIX}${normalizeTraceToken(traceToken)}`;
}

export function isT030TraceId(value: string): boolean {
  return /^trace-[A-Za-z0-9._/-]+$/.test(value);
}

function normalizeTraceToken(traceToken: string): string {
  return traceToken.trim().replace(/\s+/g, "-");
}
