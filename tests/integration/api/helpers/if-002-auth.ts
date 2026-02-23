import { IF002_TEST_USERS } from "../fixtures/if-002-users";

export interface If002JwtClaims {
  sub: string;
  role: string;
  email: string;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createIf002StubJwt(actorUserId: string): string {
  const knownUser = IF002_TEST_USERS[actorUserId as keyof typeof IF002_TEST_USERS];
  const claims: If002JwtClaims = {
    sub: actorUserId,
    role: knownUser?.roleId ?? "ROLE-001",
    email: knownUser?.email ?? `${actorUserId}@example.test`,
  };

  const header = toBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = toBase64Url(JSON.stringify(claims));
  const signature = "stub-signature";

  return `${header}.${payload}.${signature}`;
}

export function createIf002AuthHeaders(actorUserId: string, requestId = "if-002-red-request-id"): Record<string, string> {
  return {
    Authorization: `Bearer ${createIf002StubJwt(actorUserId)}`,
    "Content-Type": "application/json",
    "X-Request-Id": requestId,
  };
}
