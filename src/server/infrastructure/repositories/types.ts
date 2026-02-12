export type RepositoryErrorCode =
  | 'PROFILE_NOT_FOUND'
  | 'OPTIMISTIC_LOCK_CONFLICT'
  | 'REPOSITORY_ERROR'
  | 'HABIT_NOT_FOUND'
  | 'HABIT_NOT_ACTIVE'
  | 'CHECKIN_CONFLICT'
  | 'POLICY_NOT_FOUND'
  | 'POLICY_VERSION_CONFLICT'
  | 'AUDIT_INSERT_FAILED'
  | 'KPI_UPSERT_FAILED'
  | 'DELETION_JOB_FAILED'
  | 'ALERT_EVENT_FAILED';

export type Profile = {
  userId: string;
  timezone: string;
  dayCutoffTime: string;
  accountStatus: 'active' | 'disabled' | 'deleted';
  version: number;
};

export type HabitStatus = 'active' | 'archived';

export type HabitRecord = {
  id: string;
  user_id: string;
  name: string;
  display_order: number;
  status: HabitStatus;
  archived_at: string | null;
};

export interface CurrentPolicy {
  policyType: 'terms' | 'privacy';
  currentVersion: string;
  effectiveFrom: string;
}

export type DeletionJobStatus = 'queued' | 'in_progress' | 'completed' | 'failed';
