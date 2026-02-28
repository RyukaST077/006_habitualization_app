import {
  isSamePolicyVersion,
  normalizePolicyType,
  resolveLatestConsentsByType,
  type PolicyConsentRow,
  type PolicySettingRow,
} from "../if-001/session-state-utils";

export type PolicyConsentInsertRow = {
  user_id: string;
  policy_type: string;
  policy_version: string;
  consented_at: string;
};

export function buildPolicyConsentRowsToInsert(
  userId: string,
  policySettings: readonly PolicySettingRow[],
  latestConsentRows: readonly PolicyConsentRow[],
  nowIso: string,
  requiredPolicyTypes: readonly string[] = ["terms", "privacy"],
): PolicyConsentInsertRow[] {
  const latestByType = resolveLatestConsentsByType(latestConsentRows);
  const requiredSet = new Set(requiredPolicyTypes);
  const rows: PolicyConsentInsertRow[] = [];

  for (const setting of policySettings) {
    const normalizedType = normalizePolicyType(setting.policy_type);
    if (!requiredSet.has(normalizedType)) {
      continue;
    }
    const latestVersion = latestByType.get(normalizedType);
    if (latestVersion && isSamePolicyVersion(latestVersion, setting.current_version)) {
      continue;
    }

    rows.push({
      user_id: userId,
      policy_type: normalizedType,
      policy_version: setting.current_version,
      consented_at: nowIso,
    });
  }

  return rows;
}

