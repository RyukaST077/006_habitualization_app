# M-012 OpsAlertService

## 1. 概要
監視通知イベントを単一通知先へ配信する。

## 2. パッケージ/配置
- Package: `application/ops`
- File: `OpsAlertService.ts`

## 3. 依存関係
- `NotificationGateway`（メール/Webhook）
- `M-104 OpsRepository`

## 4. 公開メソッド
### 4.1 `dispatchPendingAlerts()`
1. `monitoring_alert_events` の pending を取得。
2. 通知送信。
3. 成功/失敗ステータス更新。

### 4.2 `shouldSendP2(config)`
- P2既定無効。設定有効時のみtrue。

## 5. 内部構造
```ts
type AlertLevel = 'P1'|'P2';
```

## 6. エラー
- `NOTIFICATION_SEND_FAILED`
