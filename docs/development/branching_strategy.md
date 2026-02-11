# ブランチ運用戦略

## 基本方針

本リポジトリは GitHub Flow を採用します。

- 永続ブランチは `main` のみ
- 機能開発・修正はトピックブランチで実施
- 変更反映は Pull Request（PR）経由で行う

## 命名規則

トピックブランチは次の形式で作成します。

- `feature/T-xxx-<short-description>`

例:

- `feature/T-001-repo-bootstrap`
- `feature/T-013-auth-session`

`T-xxx` は3桁タスクID（例: `T-001`）を必須とします。

## 開発フロー

1. `main` から最新を取り込み、作業ブランチを作成する。
2. 実装・テスト・ドキュメント更新を行う。
3. PRを作成し、レビューと必須チェックの完了を待つ。
4. 承認後に `main` へマージする。
