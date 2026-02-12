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

## 6.1 CI buildゲート検証（main向け）
- [ ] `.github/workflows/ci.yml` に `push.branches: [main]` が定義されている。
- [ ] `build` ジョブに `if: github.event_name == 'push' && github.ref == 'refs/heads/main'` が設定されている。
- [ ] `build` ジョブに `needs: [lint, typecheck, test]` が設定され、前段ジョブ成功時のみ実行される。
- [ ] `build` 実行は `npm ci` と `npm run build` のみで完結し、平文Secretsをworkflowに埋め込んでいない。
- [ ] `npm run build` の失敗時は `build` ジョブが失敗し、workflow全体が失敗ステータスになる。

## 8. E2Eスモーク実行前チェック（READMEと同一）
### E2E前提条件（共通）
- [ ] 依存関係をインストールする（`npm install`）。
- [ ] Chrome が実行環境にインストールされている。
- [ ] `SUPABASE_ENV` / `SUPABASE_URL` / `SUPABASE_ANON_KEY` が設定済みである。
- [ ] `SUPABASE_ENV` が `prod` / `production` ではない。
- [ ] `SUPABASE_URL` が本番環境URLを指していない。
- [ ] 必要に応じて `E2E_BASE_URL` を設定する（未設定時は `http://127.0.0.1:3000`）。

実行コマンド:
- [ ] `npm run test:e2e:smoke:list`（スモーク検出、本番接続ガード有効）
- [ ] `npm run test:e2e:smoke`（スモーク実行、本番接続ガード有効）

失敗時確認:
- [ ] `[E2E-GUARD] Missing required environment variables` の場合は欠落キーを設定して再実行する。
- [ ] `[E2E-GUARD] Production environment is forbidden for smoke tests` の場合は `SUPABASE_ENV` を非本番値へ修正する。
- [ ] `[E2E-GUARD] Production-like URL is forbidden for smoke tests` の場合は `SUPABASE_URL` を検証環境向けへ修正する。

## 7. テスト関連Secretsの取り扱い
- [ ] テスト手順書・README・PR説明へSecrets平文を記載していない。
- [ ] CI設定には秘密管理機能（Repository/Environment Secrets）を使用している。
- [ ] ログ共有時はURL・キー等の機密値をマスクしている。

## 9. DB migration検証（Supabase）
- [ ] `npm run db:start` でローカルDBを起動できる。
- [ ] `npm run db:status` で状態確認できる（未起動時は原因メッセージを確認する）。
- [ ] `supabase/migrations/00000000000000_init.sql` が存在する。
- [ ] DDL変更時に `supabase db diff -f <name>` で migration を生成している。
- [ ] `supabase db reset` で migration 再適用と seed 初期化を検証している。
- [ ] 反映前に `supabase db push` の対象差分を確認している。
