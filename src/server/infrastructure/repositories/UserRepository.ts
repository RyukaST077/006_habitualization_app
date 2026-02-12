import type { SupabaseClient } from '@supabase/supabase-js';

import type { Profile } from './types';

type ProfileSettings = {
  timezone: string;
  dayCutoffTime: string;
  version: number;
};

type DailyActivityDelta = {
  userId: string;
  logDate: string;
  loginDelta: number;
  checkinDelta: number;
};

export class UserRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('user_id, timezone, day_cutoff_time, account_status, version')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`REPOSITORY_ERROR:${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      userId: data.user_id as string,
      timezone: data.timezone as string,
      dayCutoffTime: data.day_cutoff_time as string,
      accountStatus: data.account_status as 'active' | 'disabled' | 'deleted',
      version: data.version as number,
    };
  }

  async updateProfileSettings(userId: string, settings: ProfileSettings): Promise<void> {
    const { error } = await this.client
      .from('profiles')
      .update({
        timezone: settings.timezone,
        day_cutoff_time: settings.dayCutoffTime,
        version: settings.version + 1,
      })
      .eq('user_id', userId)
      .eq('version', settings.version);

    if (error) {
      throw new Error(`OPTIMISTIC_LOCK_CONFLICT:${error.message}`);
    }
  }

  async incrementDailyActivity(delta: DailyActivityDelta): Promise<void> {
    const { error } = await this.client.from('user_daily_activity').upsert(
      {
        user_id: delta.userId,
        activity_date: delta.logDate,
        login_count: delta.loginDelta,
        checkin_count: delta.checkinDelta,
      },
      { onConflict: 'user_id,activity_date' },
    );

    if (error) {
      throw new Error(`REPOSITORY_ERROR:${error.message}`);
    }
  }

  async markAccountDisabled(userId: string, disabledAt: string): Promise<void> {
    const { error } = await this.client
      .from('profiles')
      .update({ account_status: 'disabled', disabled_at: disabledAt })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`PROFILE_NOT_FOUND:${error.message}`);
    }
  }
}

