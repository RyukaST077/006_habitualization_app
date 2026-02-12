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

