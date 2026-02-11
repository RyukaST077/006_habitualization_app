# Habitualization App

習慣化アプリの開発リポジトリです。ここでは、ローカル開発の開始手順と開発運用の入口を定義します。

## セットアップ

1. 必要ツールを確認する
   - `git`
2. 環境変数ファイルを準備する
   - `.env.example` または `.env.template` を複製して `.env.local` などを作成
3. シークレットをローカルに設定する
   - APIキーや認証情報はローカル環境変数のみで管理

## 開発コマンド

現時点で統一された実行基盤は未定のため、タスク単位で必要コマンドを定義します。

- 変更確認: `git status`
- 差分確認: `git diff`
- タスク参照: `_tasks/T-001.md`

## 設計書への導線

- 実装計画: `docs/implements_plan.md`
- プロジェクト設計: `docs/01_Project_Design/`

## セキュリティ運用ルール

- `.env*` はリポジトリにコミットしない。
- シークレットを平文でリポジトリに保存しない。
- 認証情報は必要最小権限で発行し、漏えい時は速やかにローテーションする。

## GitHub運用導線

- PR運用の入口: `.github/README.md`
- ブランチ運用: `docs/development/branching_strategy.md`
- マージ条件: `docs/development/merge_policy.md`
