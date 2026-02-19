# 環境/Secrets運用の検証手順

## 1. 目的
- Dev/Stg/Prod の環境分離を維持し、誤接続（Preview から Prod への接続）を防止する。
- シークレット管理方針の継続運用を点検する。

## 1.1 基盤整備後の確認（PR-001）
- [ ] `test -f .gitignore` を実行し、除外設定ファイルの存在を確認した。
- [ ] `test -f .editorconfig` を実行し、エディタ共通設定の存在を確認した。
- [ ] `test -f README.md` を実行し、初期セットアップ手順の存在を確認した。
- [ ] `git status --short` を実行し、`.env*` の実値ファイルが未追跡であることを確認した。

## 1.2 CODEOWNERS整備後の確認（PR-003）
- [ ] `test -f .github/CODEOWNERS` を実行し、CODEOWNERS ファイルの存在を確認した。
- [ ] `rg "^\\S+\\s+@" .github/CODEOWNERS` を実行し、パスルールとオーナー定義を確認した。
- [ ] `rg "CODEOWNERS" docs/development/merge_policy.md` を実行し、レビュー要件の追記を確認した。

## 1.3 環境雛形定義後の確認（T-002 / PR-001）
- [ ] `test -f .env.example && test -f .env.stg.example && test -f .env.prod.example` を実行し、環境雛形ファイルの存在を確認した。
- [ ] `rg "(prod|production).*(apikey|secret|service_role)" .env*.example` を実行し、雛形に本番実値の平文が含まれていないことを確認した。
- [ ] `rg "Preview.*Prod|本番DBへ接続しない" README.md docs/development/environment_validation.md` を実行し、Preview から Prod への接続禁止ルールを確認した。

## 2. 環境分離チェック（PR前/デプロイ前）
- [ ] Preview 環境の環境変数が Prod 接続先を参照していない。
- [ ] Dev/Stg/Prod の `SUPABASE_URL` が環境ごとに分離されている。
- [ ] `service_role` がクライアント設定や公開設定に含まれていない。
- [ ] 本番向け設定変更はレビュー記録付きで実施されている。

## 3. Secrets運用チェック（定常運用）
- [ ] 月次 で Secrets の 棚卸し を実施し、不要キーを無効化した。
- [ ] GitHub/Vercel/Supabase それぞれの保管値が最新ローテーション状態で一致している。
- [ ] ローテーション記録（実施日、担当者、影響範囲、復旧確認）を残している。

### 3.2 CI `secret-scan` 検証（PR-003）
- [ ] `secret-scan` workflow が `pull_request` と `push` をトリガーに実行されることを確認した。
- [ ] PR のステータスチェックで `secret-scan` が `success` 以外の場合、マージをブロックする運用を確認した。
- [ ] 検知時は `4.1 secret-scan失敗時の復旧フロー` に従って再実行し、成功までマージしないことを確認した。

## 3.1 週次セキュリティ運用チェック（OPS-W-002）
- [ ] `test -f .github/dependabot.yml` を実行し、Dependabot設定ファイルの存在を確認した。
- [ ] `rg "package-ecosystem" .github/dependabot.yml` を実行し、`npm` と `github-actions` の対象定義を確認した。
- [ ] `test -f .github/workflows/secret-scan.yml` を実行し、secret scan workflowの存在を確認した。
- [ ] `rg "pull_request|push" .github/workflows/secret-scan.yml` を実行し、PR/pushトリガーを確認した。
- [ ] `rg "Content-Security-Policy|X-Content-Type-Options|Referrer-Policy|X-Frame-Options|frame-ancestors" middleware.ts` を実行し、必須ヘッダを確認した。
- [ ] `npm run test -- tests/security/headers.spec.ts` を実行し、CSP/セキュリティヘッダ検証テストの成功を確認した。

## 4. 漏えい時チェック（インシデント対応）
- [ ] 漏えい 疑い発生時の 初動 として、対象キーを即時無効化した。
- [ ] 代替キーを発行し、GitHub/Vercel/Supabase へ再設定した。
- [ ] 影響範囲を調査し、監査ログと再発防止策を記録した。

### 4.1 secret-scan失敗時の復旧フロー
- [ ] `secret-scan` の検知内容を確認し、誤検知か漏えい疑いかを分類した。
- [ ] 漏えい疑いがある場合は、対象キーを即時無効化した。
- [ ] 新規キーを発行し、GitHub/Vercel/Supabaseの順で再設定した。
- [ ] 失効前キーへの依存がないことを確認し、監査ログへ作業記録を残した。
- [ ] 修正コミット後に `secret-scan` の再実行成功を確認してからPRブロックを解除した。

## 5. PRレビュー時チェック
- [ ] 環境変数の追加/変更があるPRは、接続先の環境区分（Dev/Stg/Prod）を明示している。
- [ ] シークレットの取り扱い変更があるPRは、秘密管理基盤での設定手順を明示している。
- [ ] セキュリティ観点（SQLインジェクション対策、XSS対策、認証/認可・RLS維持）をレビュー済みである。
- [ ] `secret-scan` workflow が成功している（失敗時はマージしない）。
- [ ] `secret-scan` 失敗時は、誤検知切り分けと漏えい有無確認の結果をPRに記録している。
- [ ] 漏えいが疑われる場合は、キー無効化・再発行・再設定の完了を確認している。

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

## 8.1 CSP/セキュリティヘッダ検証（手動/自動）
- [ ] 自動: `npm run test -- tests/security/headers.spec.ts` が成功する。
- [ ] 手動: `curl -I http://127.0.0.1:3000 | rg "Content-Security-Policy|X-Content-Type-Options|Referrer-Policy|X-Frame-Options"` で必須ヘッダが確認できる。

## 11. テストデータ（fixture）更新時の確認フロー
### 11.0 PR-002（Unit/IT基盤）導入時の最小確認
- [ ] `test -f tests/helpers/env-guard.ts` を実行し、環境ガード実装の存在を確認する。
- [ ] `test -f tests/helpers/fixtures.ts` を実行し、固定fixture定義の存在を確認する。
- [ ] `test -f tests/integration/supabase-connectivity.test.ts` を実行し、Integrationテスト雛形の存在を確認する。
- [ ] `npm run test -- tests/integration/supabase-connectivity.test.ts` を実行し、非本番環境で成功することを確認する。
- [ ] `SUPABASE_ENV=production npm run test -- tests/integration/supabase-connectivity.test.ts` を実行し、`Production forbidden` で失敗することを確認する。

### 11.1 unit/integration/e2e の順で検証
- [ ] Unit: `npm run test -- tests/unit/sample.test.ts` を実行し、固定fixture（`USER-A` / `USER-B` / `OPS-1`）の再現性を確認する。
- [ ] Integration: `npm run test -- tests/integration/supabase-connectivity.test.ts` を実行し、環境変数と接続先の整合性を確認する。
- [ ] E2E: `npm run test:e2e:smoke` を実行し、`SUPABASE_ENV` のガード（`dev`/`stg`）が有効であることを確認する。
- [ ] ロール確認: `ROLE-002` は匿名KPI確認および監査用途の運用ユーザーとして扱い、一般ユーザーと混在させない。

### 11.2 失敗時の切り分け
- [ ] env不足: `[E2E-GUARD] Missing required environment variables` が出た場合、`SUPABASE_ENV` / `SUPABASE_URL` / `SUPABASE_ANON_KEY` を設定して再実行する。
- [ ] fixture不整合: `USER-A` / `USER-B` / `OPS-1` のキー名・role・timezone・locale を `tests/helpers/fixtures.ts` と `tests/e2e/fixtures/users.ts` で突合する。
- [ ] ロール不一致: `ROLE-002` が一般ユーザー導線に混入していないか、監査用途の画面/ケースに限定されているかを確認する。

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

## 10. DBセットアップとRLS確認（PR-004）
- [ ] `db:start -> migration適用 -> db:seed -> db:test` の順序で実行している。
- [ ] `SUPABASE_ENV` が `prod` / `production` ではない。
- [ ] `SUPABASE_URL` が本番環境URL（production系）を指していない。
- [ ] `npm run db:test`（= `npm run test`）が成功している。
- [ ] RLS拒否確認SQLを実行し、他ユーザーデータが `0 rows` または `permission denied` であることを確認している。

RLS拒否確認SQL（例）:
- [ ] `select * from public.habit_records where user_id <> auth.uid();`

後続タスク前提コマンド:
- [ ] `T-018` 実施前に `npm run db:status` と `test -f supabase/migrations/00000000000000_init.sql` を確認した。
- [ ] `T-020` 実施前に `npm run db:status` と `test -f supabase/seed.sql` を確認した。
- [ ] `T-022` 実施前に `npm run db:status` と `npm run db:test` を確認した。

失敗時切り分け:
- [ ] env不足時は `SUPABASE_ENV` / `SUPABASE_URL` / `SUPABASE_ANON_KEY` の設定漏れを確認する。
- [ ] 本番URL誤設定時は `SUPABASE_ENV` と `SUPABASE_URL` の値を非本番へ修正する。
- [ ] migration不整合時は `supabase db reset` を再実行し、migration適用順と失敗SQLを確認する。
