# Secrets管理方針

## 1. 目的
- `service_role` と外部連携秘密を安全に保管し、漏えいリスクを最小化する。
- 定期ローテーションと事故時対応を運用手順として標準化する。

## 2. 保管先と責務
- GitHub Secrets: CI/CDで利用する秘密値を保管する。
- Vercel Environment Variables: アプリ実行時の秘密値を保管する。
- Supabase Secrets: Supabase側処理で必要な秘密値を保管する。
- `service_role` はサーバコンテキスト限定で利用し、クライアント配布を禁止する。
- 平文シークレットをリポジトリに保存しない（`.env.example` はダミー/空値のみ）。

### CI利用時の責務分界（GitHub/Vercel/Supabase）

| 基盤 | 主な責務 | 設定対象 | 禁止事項 |
|------|----------|----------|----------|
| GitHub | `lint/typecheck/test/build` 実行時の注入 | Repository/Environment Secrets | ワークフローファイルへの平文埋め込み |
| Vercel | 実行環境（Preview/Prod）のアプリ用秘密値管理 | Project Environment Variables | CI用途の秘密値をVercelだけに置く運用 |
| Supabase | DB/Edge側のサーバ秘密管理 | Supabase Secrets / Project設定 | クライアント配布可能な領域への特権鍵配置 |

### CI設定フロー

1. CIで必要な値を GitHub Secrets に設定する（必要最小限）。
2. アプリ実行で必要な値は Vercel Environment Variables に設定する。
3. Supabase 内部処理で必要な値は Supabase Secrets に設定する。
4. 同一キーは基盤ごとに用途を明記し、ローテーション時に3基盤の反映完了を確認する。

## 3. アクセス制御
- 運用者特権は最小人数に限定する。
- 運用者アカウントは MFA 必須とする。
- 共有アカウントの利用を禁止する。
- 特権操作（例: `policy_settings` 更新、`service_role` を使う運用作業）は監査ログ記録を必須とする。

## 4. ローテーション方針
- 定期ローテーションは 90日 を目安に実施する。
- 漏えいの疑いがある場合は即時ローテーションする。
- ローテーション時は旧キー失効を確認し、接続先（GitHub/Vercel/Supabase）への反映完了を記録する。

## 5. 漏えい時対応
1. 漏えい疑いを検知した時点で当該キーを即時無効化する。
2. 新しいキーを発行し、GitHub/Vercel/Supabaseへ再設定する。
3. 影響範囲を調査し、必要なインシデント報告・再発防止策を記録する。
4. 監査ログと変更履歴を保全する。

### 5.1 secret-scan連携時の即時ローテーション手順
1. `.github/workflows/secret-scan.yml` の失敗を検知したら、検知ファイルとコミット範囲を確認する。
2. 漏えい疑いが否定できない場合は、対象キーを即時無効化する。
3. 新規キーを発行し、GitHub/Vercel/Supabaseに再設定して反映順序を記録する。
4. 旧キー参照箇所を修正し、再実行した `secret-scan` の成功を確認する。
5. 原因、影響範囲、恒久対策をPRまたは運用記録へ残す。

## 6. 運用チェックリスト
- `service_role` がクライアント設定へ混入していない。
- SecretsはGitHub/Vercel/Supabaseの秘密管理のみで保持している。
- 90日以内のローテーション実績がある。
- 漏えい時の即時ローテーション手順が最新化されている。
- `secret-scan` workflow（PR/push）が有効で、検知失敗時はマージを停止している。
- `secret-scan` で漏えい疑いを検知した場合、無効化→再発行→再設定を同日中に開始している。

## 7. E2Eテストユーザー情報の管理方針
- E2Eテストユーザー（`USER-A` / `USER-B` / `OPS-1`）の識別情報はシークレットとして扱い、リポジトリへ平文保存しない。
- `E2E_USER_A_EMAIL` / `E2E_USER_B_EMAIL` / `E2E_OPS_1_EMAIL` はダミー値のみをテンプレートに記載し、実値はSecrets管理基盤で管理する。
- `ROLE-002` 相当の運用ユーザーは匿名KPIと監査用途に限定し、一般ユーザー用のE2Eケースへ流用しない。
- E2E実行ログ・スクリーンショット共有時は、テストユーザーのメールやシークレット値が露出しないようにマスクする。
