import type { SupabaseClient } from '@supabase/supabase-js';

import type { HabitStatus } from './types';

type HabitUpdatePayload = {
  name?: string;
  displayOrder?: number;
};

export class HabitRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listHabits(userId: string, status?: HabitStatus): Promise<unknown[]> {
    let query = this.client.from('habits').select('*').eq('user_id', userId);
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('display_order', { ascending: true });
    if (error) {
      throw new Error(`HABIT_NOT_FOUND:${error.message}`);
    }

    return data ?? [];
  }

  async createHabit(userId: string, name: string, displayOrder: number): Promise<unknown> {
    const { data, error } = await this.client
      .from('habits')
      .insert({ user_id: userId, name, display_order: displayOrder, status: 'active' })
      .select('*')
      .single();

    if (error) {
      throw new Error(`HABIT_NOT_FOUND:${error.message}`);
    }

    return data;
  }

  async updateHabit(userId: string, habitId: string, payload: HabitUpdatePayload): Promise<void> {
    const { error } = await this.client
      .from('habits')
      .update({
        name: payload.name,
        display_order: payload.displayOrder,
      })
      .eq('id', habitId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`HABIT_NOT_FOUND:${error.message}`);
    }
  }

  async setHabitStatus(userId: string, habitId: string, status: HabitStatus): Promise<void> {
    const { error } = await this.client
      .from('habits')
      .update({ status })
      .eq('id', habitId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`HABIT_NOT_ACTIVE:${error.message}`);
    }
  }

  async upsertCheckin(
    userId: string,
    habitId: string,
    logDate: string,
    checkedInAt: string,
  ): Promise<void> {
    const { error } = await this.client.from('habit_logs').upsert(
      {
        user_id: userId,
        habit_id: habitId,
        log_date: logDate,
        checked_in_at: checkedInAt,
      },
      { onConflict: 'habit_id,log_date' },
    );

    if (error) {
      throw new Error(`CHECKIN_CONFLICT:${error.message}`);
    }
  }

  async deleteCheckin(userId: string, habitId: string, logDate: string): Promise<void> {
    const { error } = await this.client
      .from('habit_logs')
      .delete()
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('log_date', logDate);

    if (error) {
      throw new Error(`CHECKIN_CONFLICT:${error.message}`);
    }
  }

  async findLogsByDateRange(
    userId: string,
    fromDate: string,
    toDate: string,
    includeArchived: boolean,
  ): Promise<unknown[]> {
    const { data, error } = await this.client
      .from('habit_logs')
      .select('*, habits!inner(status)')
      .eq('user_id', userId)
      .gte('log_date', fromDate)
      .lte('log_date', toDate)
      .or(includeArchived ? 'habits.status.eq.active,habits.status.eq.archived' : 'habits.status.eq.active');

    if (error) {
      throw new Error(`HABIT_NOT_FOUND:${error.message}`);
    }

    return data ?? [];
  }
}

