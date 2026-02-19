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

### PR作成時の必須運用

- PR作成時は `.github/PULL_REQUEST_TEMPLATE.md` を使用し、必須欄を埋める。
- `lint/typecheck/test` の品質チェックが成功するまで `main` へマージしない。
- `main` への `push` は運用者の保守操作に限定し、`build` の成功を確認する。

## `T-xxx` とPR本文の紐付け方針

- ブランチ名の `T-xxx` とPR本文のタスクIDは一致させる。
- PR本文には `T-xxx` に紐づく対象ID（`FNC/SCR/IF/TBL`）と要件IDを記載する。
- 1つのPRで複数タスクを扱う場合は、主タスクを先頭にし、残りも省略せず列挙する。
- `T-xxx` が未記載、またはブランチ名と不一致のPRはレビュー差し戻しとする。

### PR本文の最小記載例

- `タスクID: T-009`
- `対象ID: FNC-001, SCR-002, IF-002, TBL-003`
- `要件ID: FR-010, AC-010`
- `テストID: TC-021`
