# GitHub運用ガイド

このディレクトリは、GitHub上での運用ルールを集約する入口です。

## PR運用の入口

- 変更は原則PR経由でレビューする。
- タスクは `_tasks/T-001.md` のPR単位で進める。
- 品質ゲート workflow: `.github/workflows/ci.yml`
  - 発火契機:
    - `pull_request`（opened/synchronize/reopened/ready_for_review）
    - `push`（main）
  - 実行ジョブ:
    - PR: `lint` / `typecheck` / `test`
    - main: `lint` / `typecheck` / `test` / `build`
  - 依存関係: `build` は `needs: [lint, typecheck, test]` で前段ジョブ成功後に実行
  - 運用: 失敗ジョブがある場合はPRをマージしない。ローカルで同名 `npm run` を再実行して修正する。

## セキュリティ運用

- シークレットを平文でコミットしない。
- `.env*` を含む機密情報ファイルは常に除外対象として扱う。

### Dependabot PR レビュー観点

- `.github/dependabot.yml` に従い、`npm` と `github-actions` の更新PRを週次で確認する。
- セキュリティアラート由来のPRは最優先でレビューする。
- CI（`lint` / `typecheck` / `test`）が全て成功していることを確認する。
- 依存更新で破壊的変更が疑われる場合は、リリースノートと差分を確認してからマージする。

## CODEOWNERS 運用

- 定義ファイル: `.github/CODEOWNERS`
- 現在の所有者定義: `* @aliyell`
- 適用範囲: リポジトリ内の全ファイル
- 更新手順:
  1. `.github/CODEOWNERS` を修正する。
  2. PRを作成し、レビュー承認後に反映する。
