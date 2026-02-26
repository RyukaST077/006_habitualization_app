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

function parseNumericVersion(version: string): number | null {
  const normalized = version.trim().replace(/^v/i, "");
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function isVersionConflict(currentVersion: string, nextVersion: string): boolean {
  const currentNumeric = parseNumericVersion(currentVersion);
  const nextNumeric = parseNumericVersion(nextVersion);

  if (currentNumeric !== null && nextNumeric !== null) {
    return nextNumeric <= currentNumeric;
  }

  return currentVersion === nextVersion;
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
