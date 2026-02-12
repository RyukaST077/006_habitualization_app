# T-030 Error/Audit Contract Test Cases (Red)

## 対象
- AppError 共通例外契約
- trace_id 応答契約
- 監査アサート契約

## 観点
- AppError は code/message/trace_id を保持する。
- FORBIDDEN / INTERNAL_ERROR を共通マッピングする。
- 監査ロガーは action/result/trace_id を出力契約に含む。

## Red判定
- 共通エラーモジュール未実装なら失敗。
- 監査アサート未実装なら失敗。
- T-031 実装前提のサマリーが失敗する。

## 期待失敗
- AppError contract not implemented
- Audit logger contract not implemented
- T-031 contract not implemented
