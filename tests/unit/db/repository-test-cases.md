# Repository Contract Test Cases (T-024 / Red)

## 対象
- M-101 UserRepository
- M-102 HabitRepository
- M-103 PolicyRepository
- M-104 OpsRepository

## CRUD観点

### M-101 UserRepository
- findProfile(userId): 未存在時に `null` を返す。
- updateProfileSettings(userId, timezone, cutoff, version): version不一致で `OPTIMISTIC_LOCK_CONFLICT`。
- incrementDailyActivity(userId, logDate, loginDelta, checkinDelta): `(user_id, activity_date)` でUPSERT。
- markAccountDisabled(userId, disabledAt): `account_status='disabled'` を反映。

### M-102 HabitRepository
- listHabits(userId, status?): `user_id` 境界を越えて返却しない。
- createHabit(userId, name, displayOrder): 正常作成と並び順反映。
- updateHabit(userId, habitId, payload): 他人habit更新を拒否。
- setHabitStatus(userId, habitId, status): `active/archived` 遷移のみ許可。
- upsertCheckin(userId, habitId, logDate, checkedInAt): `(habit_id, log_date)` で冪等。
- deleteCheckin(userId, habitId, logDate): 当日分以外を拒否。
- findLogsByDateRange(userId, fromDate, toDate, includeArchived): 期間境界と archived 切替。

### M-103 PolicyRepository
- getCurrentPolicies(): terms/privacy の current_version を返す。
- findUserLatestConsents(userId): policy_typeごとの最新同意を返す。
- insertConsents(userId, consents): 重複登録時は無変更成功。
- updatePolicySetting(policyType, newVersion, effectiveFrom, actor): 競合時に `POLICY_VERSION_CONFLICT`。

### M-104 OpsRepository
- insertAuditLog(record): 監査ログが必須フィールドで登録される。
- upsertDailyKpi(rows): `(metric_date, metric_key, dimension_hash)` 一意でUPSERT。
- createDeletionJob(job)/updateDeletionJobStatus(jobId, status): status遷移を維持。
- listPendingDeletionJobs(now): 期限到達の未完了ジョブのみ取得。
- insertMonitoringAlertEvent(event)/markAlertDispatched(id, result): pending/sent/failed を更新。
- queryKpiForReport(filter)/queryAuditLogsForReport(filter): report抽出のフィルタを反映。

## Tx観点
- 同一ユースケース内で複数テーブル更新が必要な操作は、途中失敗時にロールバックされること。
- policy更新 + 監査ログ記録は整合単位で扱うこと。
- 退会ジョブ更新 + 通知イベント更新は整合単位で扱うこと。

## 競合観点
- `M-101.updateProfileSettings` の楽観ロック競合。
- `M-102.upsertCheckin` の重複登録競合（冪等）。
- `M-103.updatePolicySetting` のバージョン競合。
- `M-104.updateDeletionJobStatus` の状態競合（同時更新）。

## Red判定
- Repository実装ファイルが未存在、または公開メソッドが未実装でテストが失敗する。
- 競合ケースが期待エラー（`OPTIMISTIC_LOCK_CONFLICT`, `CHECKIN_CONFLICT`, `POLICY_VERSION_CONFLICT`）で表現されていない場合に失敗する。
- Tx観点（ロールバック前提）が満たせない場合に失敗する。

## 期待失敗ログ（T-025前）
- `Repository contract not implemented`
- `Expected optimistic lock conflict`
- `Expected checkin conflict handling`
- `Expected policy version conflict handling`

