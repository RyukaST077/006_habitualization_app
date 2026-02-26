import type { PolicyRepositoryContract } from "../../domain/repositories/contracts";
import { createRepositoryError } from "../../domain/repositories/errors";
import type {
  CurrentPolicy,
  InsertConsentsResult,
  PolicyConsentInput,
  PolicySetting,
  PolicyType,
  UserPolicyConsent,
} from "../../domain/repositories/types";
import {
  buildForbiddenError,
  buildConsentKeyForRepository,
  cloneRepositoryValue,
  isServiceRoleActor,
  type SupabaseRepositoryClient,
} from "./supabase-repository-client";

function parseVersionTuple(version: string): [number, number, number] | null {
  const normalized = version.trim().replace(/^v/i, "");
  const match = normalized.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/);
  if (!match) {
    return null;
  }

  const major = Number.parseInt(match[1], 10);
  const minor = Number.parseInt(match[2] ?? "0", 10);
  const patch = Number.parseInt(match[3] ?? "0", 10);
  return [major, minor, patch];
}

function compareVersionTuple(left: [number, number, number], right: [number, number, number]): number {
  if (left[0] !== right[0]) {
    return left[0] - right[0];
  }
  if (left[1] !== right[1]) {
    return left[1] - right[1];
  }
  return left[2] - right[2];
}

function isVersionConflict(currentVersion: string, nextVersion: string): boolean {
  const currentTuple = parseVersionTuple(currentVersion);
  const nextTuple = parseVersionTuple(nextVersion);

  if (currentTuple !== null && nextTuple !== null) {
    return compareVersionTuple(nextTuple, currentTuple) <= 0;
  }

  return currentVersion === nextVersion;
}

function isOlderThanCurrentVersion(currentVersion: string, candidateVersion: string): boolean {
  const currentTuple = parseVersionTuple(currentVersion);
  const candidateTuple = parseVersionTuple(candidateVersion);

  if (currentTuple !== null && candidateTuple !== null) {
    return compareVersionTuple(candidateTuple, currentTuple) < 0;
  }

  return candidateVersion !== currentVersion;
}

export class PolicyRepository implements PolicyRepositoryContract {
  public constructor(private readonly client: SupabaseRepositoryClient) {}

  public async getCurrentPolicies(): Promise<CurrentPolicy[]> {
    const policies = [...this.client.policySettings.values()].map((setting) => ({
      policyType: setting.policyType,
      currentVersion: setting.currentVersion,
      effectiveFrom: setting.effectiveFrom,
    }));

    policies.sort((a, b) => a.policyType.localeCompare(b.policyType));
    return policies.map(cloneRepositoryValue);
  }

  public async findUserLatestConsents(userId: string): Promise<UserPolicyConsent[]> {
    const latestByType = new Map<PolicyType, UserPolicyConsent>();

    for (const consent of this.client.policyConsents.values()) {
      if (consent.userId !== userId) {
        continue;
      }

      const latest = latestByType.get(consent.policyType);
      if (latest === undefined || latest.consentedAt < consent.consentedAt) {
        latestByType.set(consent.policyType, consent);
      }
    }

    const values = [...latestByType.values()];
    values.sort((a, b) => a.policyType.localeCompare(b.policyType));
    return values.map(cloneRepositoryValue);
  }

  public async insertConsents(userId: string, consents: PolicyConsentInput[]): Promise<InsertConsentsResult> {
    let insertedCount = 0;
    let duplicateCount = 0;

    for (const consent of consents) {
      const policy = this.client.policySettings.get(consent.policyType);
      if (policy === undefined) {
        throw createRepositoryError("REPOSITORY_ERROR", `policy setting not found: ${consent.policyType}`);
      }

      if (isOlderThanCurrentVersion(policy.currentVersion, consent.policyVersion)) {
        throw createRepositoryError(
          "POLICY_VERSION_MISMATCH",
          `policy version mismatch: ${consent.policyType} expected=${policy.currentVersion} actual=${consent.policyVersion}`,
        );
      }
    }

    for (const consent of consents) {
      const key = buildConsentKeyForRepository(userId, consent.policyType, consent.policyVersion);
      const existing = this.client.policyConsents.get(key);
      if (existing !== undefined) {
        duplicateCount += 1;
        continue;
      }

      const inserted: UserPolicyConsent = {
        userId,
        policyType: consent.policyType,
        policyVersion: consent.policyVersion,
        consentedAt: consent.consentedAt,
      };

      this.client.policyConsents.set(key, inserted);
      insertedCount += 1;
    }

    return {
      insertedCount,
      duplicateCount,
    };
  }

  public async updatePolicySetting(
    policyType: PolicyType,
    newVersion: string,
    effectiveFrom: string,
    actor: string,
  ): Promise<PolicySetting> {
    if (!isServiceRoleActor(actor)) {
      throw buildForbiddenError("updatePolicySetting requires service_role actor");
    }

    const current = this.client.policySettings.get(policyType);
    if (current === undefined) {
      throw createRepositoryError("REPOSITORY_ERROR", `policy setting not found: ${policyType}`);
    }

    if (isVersionConflict(current.currentVersion, newVersion)) {
      throw createRepositoryError("POLICY_VERSION_CONFLICT", "policy version conflict");
    }

    const updated: PolicySetting = {
      ...current,
      currentVersion: newVersion,
      effectiveFrom,
      updatedBy: actor,
      updatedAt: this.client.now(),
    };

    this.client.policySettings.set(policyType, updated);
    return cloneRepositoryValue(updated);
  }
}
