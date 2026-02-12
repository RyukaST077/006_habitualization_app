import { resolveLogDate } from '../../domain/time/BusinessDateService';
import type { CheckinResult } from './CheckinTypes';

type Profile = {
  timezone: string;
  dayCutoffTime: string;
  accountStatus: 'active' | 'disabled' | 'deleted';
};

export interface CheckinUserRepositoryPort {
  findProfile(userId: string): Promise<Profile | null>;
  incrementDailyActivity(delta: {
    userId: string;
    logDate: string;
    loginDelta: number;
    checkinDelta: number;
  }): Promise<void>;
}

export interface CheckinHabitRepositoryPort {
  upsertCheckin(userId: string, habitId: string, logDate: string, checkedInAt: string): Promise<void>;
}

function normalizeCutoffTime(value: string): string {
  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.slice(0, 5);
  }
  throw new Error('VALIDATION_ERROR:dayCutoffTime');
}

function asDomainError(error: unknown): Error {
  if (error instanceof Error) {
    if (error.message.startsWith('INVALID_TIMEZONE') || error.message.startsWith('INVALID_CUTOFF_TIME')) {
      return new Error('VALIDATION_ERROR:profile_settings');
    }
    if (error.message.startsWith('CHECKIN_CONFLICT')) {
      return new Error('DOMAIN_CONFLICT:checkin');
    }
  }
  return new Error('INTERNAL_ERROR:checkin');
}

export class CheckinService {
  constructor(
    private readonly userRepository: CheckinUserRepositoryPort,
    private readonly habitRepository: CheckinHabitRepositoryPort,
  ) {}

  async registerCheckin(userId: string, habitId: string, nowUtc: Date): Promise<CheckinResult> {
    if (!userId || !habitId) {
      throw new Error('VALIDATION_ERROR:checkin_input');
    }

    const profile = await this.userRepository.findProfile(userId);
    if (!profile || profile.accountStatus !== 'active') {
      throw new Error('FORBIDDEN:inactive_profile');
    }

    try {
      const cutoff = normalizeCutoffTime(profile.dayCutoffTime);
      const logDate = resolveLogDate(nowUtc, profile.timezone, cutoff);
      await this.habitRepository.upsertCheckin(userId, habitId, logDate, nowUtc.toISOString());
      await this.userRepository.incrementDailyActivity({
        userId,
        logDate,
        loginDelta: 0,
        checkinDelta: 1,
      });

      return {
        logDate,
        idempotent: false,
      };
    } catch (error) {
      throw asDomainError(error);
    }
  }
}
