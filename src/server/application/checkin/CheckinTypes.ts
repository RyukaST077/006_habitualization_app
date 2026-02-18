export type CheckinResult = {
  logDate: string;
  idempotent: boolean;
};

export type CancelTodayCheckinInput = {
  userId: string;
  habitId: string;
  nowUtc: Date;
};

export type CancelCheckinResult = {
  logDate: string;
  canceled: boolean;
  auditAction: 'CHECKIN_CANCEL';
};
