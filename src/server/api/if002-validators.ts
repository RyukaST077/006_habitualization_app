type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

function hasAuthHeader(request: Request): boolean {
  const authHeader = request.headers.get('Authorization') ?? '';
  return authHeader.startsWith('Bearer ');
}

export function assertAuthHeader(request: Request): void {
  if (!hasAuthHeader(request)) {
    throw new Error('FORBIDDEN');
  }
}

export async function parseJsonBody(request: Request): Promise<JsonObject> {
  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error('VALIDATION_ERROR');
  }

  const body = (await request.json()) as JsonObject;
  return body ?? {};
}

export function requireKeys(payload: JsonObject, keys: string[]): void {
  for (const key of keys) {
    if (!(key in payload)) {
      throw new Error('VALIDATION_ERROR');
    }
  }
}

function asNonEmptyString(value: JsonValue | undefined): string {
  if (typeof value !== 'string') {
    throw new Error('VALIDATION_ERROR');
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error('VALIDATION_ERROR');
  }

  return normalized;
}

function asInteger(value: JsonValue | undefined): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error('VALIDATION_ERROR');
  }

  return value;
}

export function readRequestId(request: Request): string {
  return request.headers.get('X-Request-Id') ?? '';
}

export function validateHabitDto(payload: JsonObject): { name: string; displayOrder: number } {
  requireKeys(payload, ['name', 'displayOrder']);
  const name = asNonEmptyString(payload.name);
  const displayOrder = asInteger(payload.displayOrder);

  if (name.length < 1 || name.length > 80) {
    throw new Error('VALIDATION_ERROR');
  }

  if (displayOrder < 1 || displayOrder > 9999) {
    throw new Error('VALIDATION_ERROR');
  }

  return { name, displayOrder };
}

export function validateCheckinPayload(payload: JsonObject): { habitId: string } {
  requireKeys(payload, ['habitId']);
  const raw = payload.habitId;
  if (typeof raw !== 'string' && typeof raw !== 'number') {
    throw new Error('VALIDATION_ERROR');
  }

  const habitId = String(raw).trim();
  if (habitId.length === 0) {
    throw new Error('VALIDATION_ERROR');
  }

  return { habitId };
}

export function parseAuthUserId(request: Request): string {
  assertAuthHeader(request);
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    throw new Error('FORBIDDEN');
  }

  return token;
}
