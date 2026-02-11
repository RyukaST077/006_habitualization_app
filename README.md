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

## 開発コマンド

現時点で統一された実行基盤は未定のため、タスク単位で必要コマンドを定義します。

- 変更確認: `git status`
- 差分確認: `git diff`
- タスク参照: `_tasks/T-001.md`

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
