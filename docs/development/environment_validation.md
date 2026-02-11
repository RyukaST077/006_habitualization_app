# 環境/Secrets運用の検証手順

## 1. 目的
- Dev/Stg/Prod の環境分離を維持し、誤接続（Preview から Prod への接続）を防止する。
- シークレット管理方針の継続運用を点検する。

## 2. 環境分離チェック（PR前/デプロイ前）
- [ ] Preview 環境の環境変数が Prod 接続先を参照していない。
- [ ] Dev/Stg/Prod の `SUPABASE_URL` が環境ごとに分離されている。
- [ ] `service_role` がクライアント設定や公開設定に含まれていない。
- [ ] 本番向け設定変更はレビュー記録付きで実施されている。

## 3. Secrets運用チェック（定常運用）
- [ ] 月次 で Secrets の 棚卸し を実施し、不要キーを無効化した。
- [ ] GitHub/Vercel/Supabase それぞれの保管値が最新ローテーション状態で一致している。
- [ ] ローテーション記録（実施日、担当者、影響範囲、復旧確認）を残している。

## 4. 漏えい時チェック（インシデント対応）
- [ ] 漏えい 疑い発生時の 初動 として、対象キーを即時無効化した。
- [ ] 代替キーを発行し、GitHub/Vercel/Supabase へ再設定した。
- [ ] 影響範囲を調査し、監査ログと再発防止策を記録した。

## 5. PRレビュー時チェック
- [ ] 環境変数の追加/変更があるPRは、接続先の環境区分（Dev/Stg/Prod）を明示している。
- [ ] シークレットの取り扱い変更があるPRは、秘密管理基盤での設定手順を明示している。
- [ ] セキュリティ観点（SQLインジェクション対策、XSS対策、認証/認可・RLS維持）をレビュー済みである。

## 6. テスト実行時チェック（ローカル/CI共通）
- [ ] `npm run test` 実行前に `SUPABASE_ENV` / `SUPABASE_URL` / `SUPABASE_ANON_KEY` が設定されている。
- [ ] `SUPABASE_ENV` が `prod` / `production` でないことを確認した。
- [ ] `SUPABASE_URL` が本番環境URLを指していないことを確認した。
- [ ] テスト失敗時はエラーメッセージ（Missing required env / Production forbidden）に従って設定を修正した。
- [ ] カバレッジ成果物 `coverage/v8/lcov.info` が生成されることを確認した。

## 7. テスト関連Secretsの取り扱い
- [ ] テスト手順書・README・PR説明へSecrets平文を記載していない。
- [ ] CI設定には秘密管理機能（Repository/Environment Secrets）を使用している。
- [ ] ログ共有時はURL・キー等の機密値をマスクしている。
