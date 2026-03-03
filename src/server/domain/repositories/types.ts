export type UserId = string;
export type HabitId = string;
export type PolicyVersion = string;
export type ISODate = string;
export type ISODateTime = string;

export type AccountStatus = "active" | "disabled" | "deleted";

export interface Profile {
  userId: UserId;
  displayName: string;
  timezone: string;
  dayCutoffTime: string;
  accountStatus: AccountStatus;
  version: number;
}

export interface UserDailyActivity {
  userId: UserId;
  activityDate: ISODate;
  loginCount: number;
  checkinCount: number;
  updatedAt: ISODateTime;
}

export type HabitStatus = "active" | "archived";

export interface Habit {
  habitId: HabitId;
  userId: UserId;
  name: string;
  note: string | null;
  displayOrder: number;
  status: HabitStatus;
  archivedAt?: ISODateTime | null;
  version: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface HabitUpdatePayload {
  name?: string;
  note?: string | null;
  displayOrder?: number;
  version: number;
}

export interface HabitStatusUpdatePayload {
  status: HabitStatus;
  archivedAt: ISODateTime | null;
}

export interface HabitStatusPersistence {
  status: HabitStatus;
  archived_at: ISODateTime | null;
}

export interface HabitLog {
  habitId: HabitId;
  userId: UserId;
  logDate: ISODate;
  checkedInAt: ISODateTime;
}

export type PolicyType = "terms" | "privacy";

export interface CurrentPolicy {
  policyType: PolicyType;
  currentVersion: PolicyVersion;
  effectiveFrom: ISODateTime;
}

export interface UserPolicyConsent {
  userId: UserId;
  policyType: PolicyType;
  policyVersion: PolicyVersion;
  consentedAt: ISODateTime;
}

export interface PolicyConsentInput {
  policyType: PolicyType;
  policyVersion: PolicyVersion;
  consentedAt: ISODateTime;
}

export interface PolicySetting {
  policyType: PolicyType;
  currentVersion: PolicyVersion;
  effectiveFrom: ISODateTime;
  updatedBy: string;
  updatedAt: ISODateTime;
}

export interface InsertConsentsResult {
  insertedCount: number;
  duplicateCount: number;
}

export interface AuditLogRecord {
  id: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  result: string;
  requirementId: string;
  traceId: string;
  metadata: Record<string, unknown>;
  actorUserId: UserId | null;
  resourceType: string;
  resourceId: string;
  detail: Record<string, unknown>;
  occurredAt: ISODateTime;
  createdAt: ISODateTime;
}

export interface AuditLogRecordInput {
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  result?: string;
  requirementId?: string;
  traceId?: string;
  metadata?: Record<string, unknown>;
  actorUserId?: UserId | null;
  resourceType?: string;
  resourceId?: string;
  detail?: Record<string, unknown>;
}

export interface DailyKpiRow {
  kpiDate: ISODate;
  metricName: string;
  metricValue: number;
  updatedAt: ISODateTime;
}

export interface DailyKpiInput {
  kpiDate: ISODate;
  metricName: string;
  metricValue: number;
}

export type DeletionJobStatus = "queued" | "in_progress" | "completed" | "failed";

export interface AccountDeletionJob {
  jobId: string;
  userId: UserId;
  status: DeletionJobStatus;
  requestedAt: ISODateTime;
  disableDueAt: ISODateTime;
  disabledAt: ISODateTime | null;
  hardDeleteDueAt: ISODateTime;
  hardDeletedAt: ISODateTime | null;
  retryCount: number;
  lastError: string | null;
}

export interface AccountDeletionJobInput {
  userId: UserId;
  requestedAt: ISODateTime;
  disableDueAt: ISODateTime;
  hardDeleteDueAt: ISODateTime;
}

export type AlertLevel = "P1" | "P2";
export type NotificationStatus = "pending" | "sent" | "failed";

export interface MonitoringAlertEvent {
  eventId: string;
  alertLevel: AlertLevel;
  alertType: string;
  thresholdRule: string;
  observedValue: number;
  windowStartAt: ISODateTime;
  windowEndAt: ISODateTime;
  notificationTarget: string;
  notificationStatus: NotificationStatus;
  notifiedAt: ISODateTime | null;
  errorMessage: string | null;
  createdAt: ISODateTime;
}

export interface MonitoringAlertEventInput {
  alertLevel: AlertLevel;
  alertType: string;
  thresholdRule: string;
  observedValue: number;
  windowStartAt: ISODateTime;
  windowEndAt: ISODateTime;
  notificationTarget: string;
}

export interface AlertDispatchResult {
  notificationStatus: Extract<NotificationStatus, "sent" | "failed">;
  notifiedAt: ISODateTime;
  errorMessage?: string | null;
}

export interface KpiReportFilter {
  fromDate: ISODate;
  toDate: ISODate;
  metricNames?: string[];
}

export interface AuditLogReportFilter {
  from: ISODateTime;
  to: ISODateTime;
  actorUserId?: UserId;
  actions?: string[];
  resourceTypes?: string[];
  targetTypes?: string[];
  limit?: number;
}
