# Habitualization App

習慣化アプリの開発リポジトリです。ここでは、ローカル開発の開始手順と開発運用の入口を定義します。

## セットアップ

1. 必要ツールを確認する
   - `git`
2. 環境変数テンプレートを確認する
   - 共通必須キー: `.env.example`
   - 開発環境（Dev）: `.env.dev.example`（日次開発、ダミーデータのみ）
   - 検証環境（Stg）: `.env.stg.example`（受入試験、本番相当設定 + 匿名化データ）
   - 本番環境（Prod）: `.env.prod.example`（本番運用、実データ）
3. 利用環境に応じたファイルを作成する
   - 例: `cp .env.dev.example .env.local`
   - Stg/Prod はローカル複製ではなく、秘密管理基盤（GitHub/Vercel/Supabase）への設定を前提とする
4. シークレットをローカルに設定する
   - APIキーや認証情報はローカル環境変数のみで管理

## 環境ごとの差分方針

- Dev: `SUPABASE_URL` は開発用接続先を使用し、データはダミーデータのみを扱う
- Stg: `SUPABASE_URL` はステージング接続先を使用し、本番相当設定で匿名化データを扱う
- Prod: `SUPABASE_URL` は本番接続先を使用し、実データを扱う
- 共通: `SUPABASE_ANON_KEY` はクライアント公開キーのみを設定し、`service_role` のようなサーバ専用キーはテンプレートに含めない
- 運用ルール: Preview環境から本番DBへ接続しない

## テスト実行手順（`npm run test`）

### 前提

1. Node.js / npm が利用可能であること
2. `npm install` が完了していること
3. Integrationテスト向けに以下の環境変数が設定されていること
   - `SUPABASE_ENV`（例: `stg`）
   - `SUPABASE_URL`（検証環境のURL）
   - `SUPABASE_ANON_KEY`（検証環境の匿名公開キー）
4. `SUPABASE_ENV=prod` または本番系URLはテストで禁止されること

### ローカル実行

```bash
npm run test
```

### CI実行

- CIのSecrets管理機能で `SUPABASE_ENV` / `SUPABASE_URL` / `SUPABASE_ANON_KEY` を設定する
- ワークフロー内で `npm ci` 後に `npm run test` を実行する
- テスト後に `coverage/v8/lcov.info` を成果物として参照する

## ローカル再現手順（CI品質ゲート）

PRやmainのCI失敗時は、以下をローカルで順に再現する。

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

- `lint` / `typecheck` / `test` は PR必須チェックと同一。
- `build` は main向けゲート（`lint/typecheck/test` を内部実行）。

## E2E実行手順（Playwright）

### 前提

1. 依存関係をインストールする
   - `npm install`
2. Chrome が実行環境にインストールされていること
3. `SUPABASE_ENV` / `SUPABASE_URL` / `SUPABASE_ANON_KEY` が設定済みであること
4. `SUPABASE_ENV` が `prod` / `production` ではないこと
5. `SUPABASE_URL` が本番環境URLを指していないこと
6. 必要に応じて `E2E_BASE_URL` を設定する（未設定時は `http://127.0.0.1:3000`）

#### E2E前提条件（共通）

- 依存関係をインストールする（`npm install`）。
- Chrome が実行環境にインストールされている。
- `SUPABASE_ENV` / `SUPABASE_URL` / `SUPABASE_ANON_KEY` が設定済みである。
- `SUPABASE_ENV` が `prod` / `production` ではない。
- `SUPABASE_URL` が本番環境URLを指していない。
- 必要に応じて `E2E_BASE_URL` を設定する（未設定時は `http://127.0.0.1:3000`）。

### 実行

```bash
# テスト検出のみ
npm run test:e2e -- --list

# スモーク対象のみ（本番接続ガード有効）
npm run test:e2e:smoke:list

# E2E実行
npm run test:e2e

# スモーク実行（本番接続ガード有効）
npm run test:e2e:smoke
```

### 失敗時の証跡

- `playwright-report/`: HTMLレポート
- `test-results/`: 失敗時トレース・スクリーンショット・動画

### 失敗時の確認手順

1. `SUPABASE_ENV` / `SUPABASE_URL` / `SUPABASE_ANON_KEY` の未設定・誤設定を確認する
2. エラーメッセージが `[E2E-GUARD] Missing required environment variables` の場合:
   - 必須環境変数を設定し直して再実行する
3. エラーメッセージが `[E2E-GUARD] Production environment is forbidden for smoke tests` の場合:
   - `SUPABASE_ENV` を `stg` 等の非本番値へ修正する
4. エラーメッセージが `[E2E-GUARD] Production-like URL is forbidden for smoke tests` の場合:
   - `SUPABASE_URL` を検証環境向けURLに修正する
5. 接続エラーの場合:
   - `SUPABASE_URL` が検証環境向けであることとネットワーク到達性を確認する

### Secrets運用の注意

- `SUPABASE_ANON_KEY` を含む機密値をREADME・Issue・PRコメントへ平文で貼り付けない
- シークレット値の共有はGitHub/Vercel/Supabase等の秘密管理機能を使用する
- ログ出力に機密値が含まれる場合はマスクして共有する

## 開発コマンド

統一された実行基盤として `npm run test` を利用します。

- 変更確認: `git status`
- 差分確認: `git diff`
- テスト実行: `npm run test`
- CI再現: `npm run lint && npm run typecheck && npm run test && npm run build`
- タスク参照: `_tasks/T-003.md`

## 設計書への導線

- 実装計画: `docs/implements_plan.md`
- プロジェクト設計: `docs/01_Project_Design/`
- Secrets管理方針: `docs/development/secrets_management.md`
- 環境/Secrets検証手順: `docs/development/environment_validation.md`

## セキュリティ運用ルール

- `.env*` はリポジトリにコミットしない。
- シークレットを平文でリポジトリに保存しない。
- 認証情報は必要最小権限で発行し、漏えい時は速やかにローテーションする。
- `service_role` はサーバコンテキスト限定で利用する。
- 運用者特権はMFA必須、共有アカウント禁止で運用する。

## GitHub運用導線

- PR運用の入口: `.github/README.md`
- ブランチ運用: `docs/development/branching_strategy.md`
- マージ条件: `docs/development/merge_policy.md`
- 環境/Secrets点検: `docs/development/environment_validation.md`
- CODEOWNERS: `.github/CODEOWNERS`
