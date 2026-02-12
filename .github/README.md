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

### PR本文の必須記入項目（IDトレーサビリティ）

PR本文には次を必須記入とする（空欄禁止）。

- 対象ID: `FNC-xxx` / `SCR-xxx` / `IF-xxx` / `TBL-xxx`
- 要件ID: `FR-xxx` / `NFR-xxx` / `CON-xxx` / `AC-xxx`
- テストID: `TC-xxx` / `TS-xxx`
- テスト証跡リンク: CI結果、テストログ、画面キャプチャ等

記載ルール:

- 該当なしは `N/A（理由）` を明記する。
- 複数値は改行またはカンマ区切りで列挙する。
- ブランチ名の `T-xxx` とPR本文のタスクIDを一致させる。

最小記入例:

- `タスクID: T-009`
- `対象ID: FNC-001, SCR-002, IF-002, TBL-003`
- `要件ID: FR-010, AC-010`
- `テストID: TC-021`
- `テスト証跡: https://github.com/<org>/<repo>/actions/runs/<run_id>`
- `セキュリティ確認: 入力検証=変更なし / 認可=変更なし / シークレット=追加なし`

## セキュリティ運用

- シークレットを平文でコミットしない。
- `.env*` を含む機密情報ファイルは常に除外対象として扱う。

### Dependabot PR レビュー観点

- `.github/dependabot.yml` に従い、`npm` と `github-actions` の更新PRを週次で確認する。
- セキュリティアラート由来のPRは最優先でレビューする。
- CI（`lint` / `typecheck` / `test`）が全て成功していることを確認する。
- 依存更新で破壊的変更が疑われる場合は、リリースノートと差分を確認してからマージする。

### Secret scan 失敗時対応

- workflow: `.github/workflows/secret-scan.yml`（`pull_request` / `push`）を必須確認対象とする。
- `secret-scan` ジョブが失敗したPRはマージしない（修正完了までPRブロック）。
- 誤検知の可能性がある場合は、検知箇所の根拠を確認してから最小限の除外設定を検討する。
- 漏えいの可能性がある場合は、キー無効化と再発行（ローテーション）を先に実施してから修正PRを更新する。

### 週次セキュリティ運用確認（OPS-W-002）

- Dependabot設定確認: `test -f .github/dependabot.yml`
- 依存更新対象確認: `rg "package-ecosystem" .github/dependabot.yml`
- Secret scan workflow確認: `test -f .github/workflows/secret-scan.yml`
- Secret scanトリガー確認: `rg "pull_request|push" .github/workflows/secret-scan.yml`
- CSP/必須ヘッダ定義確認: `rg "Content-Security-Policy|X-Content-Type-Options|Referrer-Policy|X-Frame-Options|frame-ancestors" middleware.ts`
- ヘッダ自動検証: `npm run test -- tests/security/headers.spec.ts`

## CODEOWNERS 運用

- 定義ファイル: `.github/CODEOWNERS`
- 現在の所有者定義: `* @aliyell`
- 適用範囲: リポジトリ内の全ファイル
- 更新手順:
  1. `.github/CODEOWNERS` を修正する。
  2. PRを作成し、レビュー承認後に反映する。
