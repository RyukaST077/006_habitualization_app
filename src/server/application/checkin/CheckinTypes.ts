export type CheckinResult = {
  logDate: string;
  idempotent: boolean;
};

export const CHECKIN_AUDIT_ACTION = {
  CANCEL: 'CHECKIN_CANCEL',
} as const;

export type CheckinAuditAction =
  (typeof CHECKIN_AUDIT_ACTION)[keyof typeof CHECKIN_AUDIT_ACTION];

export type CancelTodayCheckinInput = {
  userId: string;
  habitId: string;
  nowUtc: Date;
};

export type CancelCheckinResult = {
  logDate: string;
  canceled: boolean;
  auditAction: CheckinAuditAction;
};
