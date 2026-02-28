export type PolicySettingRow = {
  policy_type: string;
  current_version: string;
};

export type PolicyConsentRow = {
  policy_type: string;
  policy_version: string;
  consented_at: string;
};

export type DecodedJwtPayload = {
  sub?: unknown;
  exp?: unknown;
};

export function extractBearerToken(authorization?: string): string | null {
  if (!authorization) {
    return null;
  }
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export function decodeJwtPayload(token: string): DecodedJwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }
  try {
    const payloadJson = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(payloadJson) as DecodedJwtPayload;
  } catch {
    return null;
  }
}

export function isExpiredJwt(payload: DecodedJwtPayload, nowMs: number = Date.now()): boolean {
  if (typeof payload.exp !== "number") {
    return false;
  }
  return payload.exp * 1000 <= nowMs;
}

export function normalizePolicyType(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePolicyVersion(version: string): string {
  return version.trim().replace(/^v/i, "").toLowerCase();
}

function parseVersionTuple(version: string): [number, number, number] | null {
  const normalized = normalizePolicyVersion(version);
  const match = normalized.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/);
  if (!match) {
    return null;
  }
  return [
    Number.parseInt(match[1], 10),
    Number.parseInt(match[2] ?? "0", 10),
    Number.parseInt(match[3] ?? "0", 10),
  ];
}

export function isSamePolicyVersion(left: string, right: string): boolean {
  const leftTuple = parseVersionTuple(left);
  const rightTuple = parseVersionTuple(right);
  if (leftTuple && rightTuple) {
    return leftTuple[0] === rightTuple[0] && leftTuple[1] === rightTuple[1] && leftTuple[2] === rightTuple[2];
  }
  return normalizePolicyVersion(left) === normalizePolicyVersion(right);
}

export function resolveLatestConsentsByType(rows: readonly PolicyConsentRow[]): Map<string, string> {
  const latestByType = new Map<string, { version: string; consentedAtMs: number }>();
  for (const row of rows) {
    const policyType = normalizePolicyType(row.policy_type);
    const current = latestByType.get(policyType);
    const consentedAtMs = Date.parse(row.consented_at);
    if (!current || consentedAtMs > current.consentedAtMs) {
      latestByType.set(policyType, { version: row.policy_version, consentedAtMs });
    }
  }
  const versions = new Map<string, string>();
  for (const [policyType, entry] of latestByType.entries()) {
    versions.set(policyType, entry.version);
  }
  return versions;
}

export function hasLatestRequiredConsents(
  policySettings: readonly PolicySettingRow[],
  consentRows: readonly PolicyConsentRow[],
  requiredPolicyTypes: readonly string[] = ["terms", "privacy"],
): boolean {
  const settingsByType = new Map<string, string>();
  for (const setting of policySettings) {
    settingsByType.set(normalizePolicyType(setting.policy_type), setting.current_version);
  }
  if (!requiredPolicyTypes.every((policyType) => settingsByType.has(policyType))) {
    return false;
  }

  const latestConsentByType = resolveLatestConsentsByType(consentRows);
  return requiredPolicyTypes.every((policyType) =>
    isSamePolicyVersion(
      latestConsentByType.get(policyType) ?? "",
      settingsByType.get(policyType) ?? "",
    ),
  );
}

