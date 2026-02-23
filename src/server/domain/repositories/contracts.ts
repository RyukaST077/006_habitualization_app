import type {
  AccountDeletionJob,
  AccountDeletionJobInput,
  AlertDispatchResult,
  AuditLogRecord,
  AuditLogRecordInput,
  AuditLogReportFilter,
  CurrentPolicy,
  DailyKpiInput,
  DailyKpiRow,
  DeletionJobStatus,
  Habit,
  HabitLog,
  HabitStatus,
  HabitUpdatePayload,
  InsertConsentsResult,
  KpiReportFilter,
  MonitoringAlertEvent,
  MonitoringAlertEventInput,
  PolicyConsentInput,
  PolicySetting,
  PolicyType,
  Profile,
  UserDailyActivity,
  UserPolicyConsent,
} from "./types";

export interface UserRepositoryContract {
  findProfile(userId: string): Promise<Profile | null>;
  updateProfileSettings(userId: string, timezone: string, cutoff: string, version: number): Promise<Profile>;
  incrementDailyActivity(
    userId: string,
    logDate: string,
    loginDelta: number,
    checkinDelta: number,
  ): Promise<UserDailyActivity>;
  markAccountDisabled(userId: string, disabledAt: string): Promise<Profile>;
}

export interface HabitRepositoryContract {
  listHabits(userId: string, status?: HabitStatus): Promise<Habit[]>;
  createHabit(userId: string, name: string, displayOrder: number): Promise<Habit>;
  updateHabit(userId: string, habitId: string, payload: HabitUpdatePayload): Promise<Habit>;
  setHabitStatus(userId: string, habitId: string, status: HabitStatus): Promise<Habit>;
  upsertCheckin(userId: string, habitId: string, logDate: string, checkedInAt: string): Promise<HabitLog>;
  deleteCheckin(userId: string, habitId: string, logDate: string): Promise<boolean>;
  findLogsByDateRange(
    userId: string,
    fromDate: string,
    toDate: string,
    includeArchived: boolean,
  ): Promise<HabitLog[]>;
}

export interface PolicyRepositoryContract {
  getCurrentPolicies(): Promise<CurrentPolicy[]>;
  findUserLatestConsents(userId: string): Promise<UserPolicyConsent[]>;
  insertConsents(userId: string, consents: PolicyConsentInput[]): Promise<InsertConsentsResult>;
  updatePolicySetting(
    policyType: PolicyType,
    newVersion: string,
    effectiveFrom: string,
    actor: string,
  ): Promise<PolicySetting>;
}

export interface OpsRepositoryContract {
  insertAuditLog(record: AuditLogRecordInput): Promise<AuditLogRecord>;
  upsertDailyKpi(rows: DailyKpiInput[]): Promise<DailyKpiRow[]>;
  createDeletionJob(job: AccountDeletionJobInput): Promise<AccountDeletionJob>;
  updateDeletionJobStatus(jobId: string, status: DeletionJobStatus): Promise<AccountDeletionJob>;
  listPendingDeletionJobs(now: string): Promise<AccountDeletionJob[]>;
  insertMonitoringAlertEvent(event: MonitoringAlertEventInput): Promise<MonitoringAlertEvent>;
  markAlertDispatched(id: string, result: AlertDispatchResult): Promise<MonitoringAlertEvent>;
  queryKpiForReport(filter: KpiReportFilter): Promise<DailyKpiRow[]>;
  queryAuditLogsForReport(filter: AuditLogReportFilter): Promise<AuditLogRecord[]>;
}
