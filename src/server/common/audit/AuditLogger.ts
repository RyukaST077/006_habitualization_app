export type HabitAuditAction =
  | 'HABIT_CREATE'
  | 'HABIT_UPDATE'
  | 'HABIT_ARCHIVE'
  | 'HABIT_RESUME';

export type AuditRecord = {
  audit: true;
  action: HabitAuditAction | string;
  result: 'success' | 'failure';
  trace_id: string;
  actorId?: string;
  detail?: Record<string, unknown>;
};

export class AuditLogger {
  log(record: AuditRecord): AuditRecord {
    return {
      audit: true,
      action: record.action,
      result: record.result,
      trace_id: record.trace_id,
      actorId: record.actorId,
      detail: record.detail,
    };
  }
}
