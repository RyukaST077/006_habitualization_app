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

## 環境変数セットアップ（Dev/Stg/Prod）

環境ごとに接続先を分離し、テンプレートから環境変数を作成してください。

```bash
# Dev
cp .env.example .env.local

# Stg (例)
cp .env.stg.example .env.stg.local

# Prod (例)
cp .env.prod.example .env.prod.local
```

設定時の注意:
- `.env*.example` にはダミー値のみを置き、実値のシークレットを保存しない。
- Preview 環境から Prod 接続先（本番DB / 本番Supabase URL）へは接続しない。
- `SUPABASE_ENV` と `NEXT_PUBLIC_SUPABASE_URL` は必ず環境ごとに分離する。

## 主要ドキュメント

- `docs/implements_plan.md`
- `docs/development/branching_strategy.md`
- `docs/development/merge_policy.md`
- `docs/development/secrets_management.md`
- `docs/development/environment_validation.md`

Secrets運用ルールの詳細は `docs/development/secrets_management.md` を参照してください。
