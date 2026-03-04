export interface CheckinResult {
  logDate: string;
  idempotent: boolean;
}

export interface CheckinCancelResult {
  logDate: string;
  canceled: true;
}
