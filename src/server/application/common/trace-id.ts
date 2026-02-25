import { randomUUID } from "node:crypto";

const TRACE_ID_PREFIX = "trace-";

function hasTracePrefix(value: string): boolean {
  return value.startsWith(TRACE_ID_PREFIX);
}

export function normalizeTraceId(traceId: string): string {
  const normalized = traceId.trim();
  if (normalized.length === 0) {
    return `${TRACE_ID_PREFIX}${randomUUID()}`;
  }

  return hasTracePrefix(normalized) ? normalized : `${TRACE_ID_PREFIX}${normalized}`;
}
