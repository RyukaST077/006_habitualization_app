import type { SupabaseClient } from '@supabase/supabase-js';

import type { CurrentPolicy } from './types';

type ConsentRecord = {
  policyType: 'terms' | 'privacy';
  consentedVersion: string;
  consentedAt: string;
};

export class PolicyRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getCurrentPolicies(): Promise<CurrentPolicy[]> {
    const { data, error } = await this.client
      .from('policy_settings')
      .select('policy_type, current_version, effective_from')
      .in('policy_type', ['terms', 'privacy']);

    if (error) {
      throw new Error(`POLICY_NOT_FOUND:${error.message}`);
    }

    return (data ?? []).map((row) => ({
      policyType: row.policy_type as 'terms' | 'privacy',
      currentVersion: row.current_version as string,
      effectiveFrom: row.effective_from as string,
    }));
  }

  async findUserLatestConsents(userId: string): Promise<ConsentRecord[]> {
    const { data, error } = await this.client
      .from('policy_consents')
      .select('policy_type, consented_version, consented_at')
      .eq('user_id', userId)
      .order('consented_at', { ascending: false });

    if (error) {
      throw new Error(`POLICY_NOT_FOUND:${error.message}`);
    }

    return (data ?? []).map((row) => ({
      policyType: row.policy_type as 'terms' | 'privacy',
      consentedVersion: row.consented_version as string,
      consentedAt: row.consented_at as string,
    }));
  }

  async insertConsents(userId: string, consents: ConsentRecord[]): Promise<void> {
    const payload = consents.map((consent) => ({
      user_id: userId,
      policy_type: consent.policyType,
      consented_version: consent.consentedVersion,
      consented_at: consent.consentedAt,
    }));

    const { error } = await this.client
      .from('policy_consents')
      .upsert(payload, { onConflict: 'user_id,policy_type,consented_version' });

    if (error) {
      throw new Error(`POLICY_VERSION_CONFLICT:${error.message}`);
    }
  }

  async updatePolicySetting(
    policyType: 'terms' | 'privacy',
    newVersion: string,
    effectiveFrom: string,
    actor: string,
  ): Promise<void> {
    // transaction boundary in service layer: policy_settings update + audit log insert.
    const { error } = await this.client
      .from('policy_settings')
      .update({
        current_version: newVersion,
        effective_from: effectiveFrom,
        updated_by: actor,
      })
      .eq('policy_type', policyType);

    if (error) {
      throw new Error(`POLICY_VERSION_CONFLICT:${error.message}`);
    }
  }
}

