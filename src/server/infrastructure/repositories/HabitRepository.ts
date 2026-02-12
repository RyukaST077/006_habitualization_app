import type { SupabaseClient } from '@supabase/supabase-js';

import type { Habit, UpdateHabitPayload } from '../../application/habit/HabitTypes';
import type { HabitRecord, HabitStatus } from './types';

function mapHabitRecord(record: HabitRecord): Habit {
  return {
    id: record.id,
    userId: record.user_id,
    name: record.name,
    displayOrder: record.display_order,
    status: record.status,
    archivedAt: record.archived_at,
  };
}

export class HabitRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listHabits(userId: string, status?: HabitStatus): Promise<Habit[]> {
    let query = this.client.from('habits').select('*').eq('user_id', userId);
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('display_order', { ascending: true });
    if (error) {
      throw new Error(`HABIT_NOT_FOUND:${error.message}`);
    }

    return ((data as HabitRecord[] | null) ?? []).map(mapHabitRecord);
  }

  async createHabit(userId: string, name: string, displayOrder: number): Promise<Habit> {
    const { data, error } = await this.client
      .from('habits')
      .insert({
        user_id: userId,
        name,
        display_order: displayOrder,
        status: 'active',
        archived_at: null,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`HABIT_NOT_FOUND:${error.message}`);
    }

    return mapHabitRecord(data as HabitRecord);
  }

  async updateHabit(userId: string, habitId: string, payload: UpdateHabitPayload): Promise<Habit> {
    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('INVALID_HABIT_INPUT:name');
    }
    if (payload.displayOrder !== undefined && payload.displayOrder < 1) {
      throw new Error('INVALID_HABIT_INPUT:displayOrder');
    }

    const { data, error } = await this.client
      .from('habits')
      .update({
        name: payload.name,
        display_order: payload.displayOrder,
      })
      .eq('id', habitId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      // Owner-scope query (`eq('user_id', userId)`) is the repository boundary for FORBIDDEN.
      throw new Error(`HABIT_NOT_FOUND:${error.message}`);
    }

    return mapHabitRecord(data as HabitRecord);
  }

  async setHabitStatus(userId: string, habitId: string, status: HabitStatus): Promise<Habit> {
    if (status !== 'active' && status !== 'archived') {
      throw new Error('INVALID_HABIT_INPUT:status');
    }

    const archivedAt = status === 'archived' ? new Date().toISOString() : null;

    const { data, error } = await this.client
      .from('habits')
      .update({ status, archived_at: archivedAt })
      .eq('id', habitId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`HABIT_NOT_ACTIVE:${error.message}`);
    }

    return mapHabitRecord(data as HabitRecord);
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
