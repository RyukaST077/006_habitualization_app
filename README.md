# Habitualization App

習慣化アプリ開発用のリポジトリです。まずはリポジトリ運用の基盤（ブランチ運用、品質ゲート、Secrets運用）を整備します。

## 最小セットアップ

1. リポジトリを取得する。
2. `main` から作業ブランチを作成する（例: `feature/T-001-repo-bootstrap`）。
3. 運用ドキュメントを確認する。

```bash
ls docs/development
```

## 初期検証コマンド

次のコマンドがすべて成功することを確認してください。

```bash
test -d .git
test -f .gitignore
test -f .editorconfig
test -f README.md
test -f docs/implements_plan.md
```

## 主要ドキュメント

- `docs/implements_plan.md`
- `docs/development/branching_strategy.md`
- `docs/development/merge_policy.md`
- `docs/development/secrets_management.md`
- `docs/development/environment_validation.md`
