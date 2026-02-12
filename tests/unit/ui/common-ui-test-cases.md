# 共通UIテストケース設計（PR-001）

## 1. 目的
- 共通UI（ヘッダー/フッター/エラー表示）のユニットテスト作成に向け、観測点と期待結果を固定する。
- 本書は `T-014 / PR-001` の Red段階向け設計であり、実装未完了時に失敗する期待値を含む。

## 2. 設計トレース
| 仕様ID | 仕様概要 | 参照 |
|---|---|---|
| SCR-COM-3.1-H | ヘッダー: ロゴ/ホーム/履歴/設定/ログアウトを表示 | `docs/02_Detailed_Design/07_Screen_Design/00_Screen_Common.md` 3.1 |
| SCR-COM-3.1-F | フッター: 利用規約/プライバシーポリシー/コピーライトを表示 | `docs/02_Detailed_Design/07_Screen_Design/00_Screen_Common.md` 3.1 |
| SCR-COM-3.2-400 | 400はフィールド下インライン表示 | `docs/02_Detailed_Design/07_Screen_Design/00_Screen_Common.md` 3.2 |
| SCR-COM-3.2-403 | 403は画面上部インライン、詳細理由は非表示 | `docs/02_Detailed_Design/07_Screen_Design/00_Screen_Common.md` 3.2 |
| SCR-COM-3.2-409 | 409はトースト + 必要時導線表示 | `docs/02_Detailed_Design/07_Screen_Design/00_Screen_Common.md` 3.2 |
| SCR-COM-3.2-500 | 500は共通文言トースト + `trace_id` 表示 | `docs/02_Detailed_Design/07_Screen_Design/00_Screen_Common.md` 3.2 |
| IF-COM-ERR | 共通エラー応答は `code/message/trace_id/requirement_id` を持つ | `docs/02_Detailed_Design/08_Interface_Design/00_Interface_Common.md` 2.3 |
| IF-002-ERR | IF-002のエラー体系は400/403/409/500 | `docs/02_Detailed_Design/08_Interface_Design/IF-002_アプリ業務データAPI.md` 4, 5 |

## 3. テスト観測点
- ヘッダー: 文言表示、リンク存在、遷移先（`/home`, `/history`, `/settings`）、ログアウト操作導線。
- フッター: 文言表示、リンク存在（利用規約/プライバシーポリシー）、コピーライト表示。
- エラー表示: ステータス別の描画位置（フィールド下/画面上部/トースト）とメッセージ制約。
- `trace_id`: 500のみ可視化。400/403/409では非表示。
- セキュリティ観点: 403で内部詳細を露出しない（情報漏えい防止）。

## 4. テストケース一覧（正常系・異常系・境界値）
| TC ID | 区分 | 対象 | 前提/入力 | 観測点 | 期待結果（Red段階の失敗前提） | トレース |
|---|---|---|---|---|---|---|
| TC-UI-COM-001 | 正常系 | ヘッダー | 共通レイアウトを描画 | ロゴ表示 | `getByRole('img' or 'link', {name:/logo/i})` が見つかる想定。未実装時は fail。 | SCR-COM-3.1-H |
| TC-UI-COM-002 | 正常系 | ヘッダー | 共通レイアウトを描画 | ナビ項目表示 | `ホーム/履歴/設定/ログアウト` が全て表示される想定。未実装時は fail。 | SCR-COM-3.1-H |
| TC-UI-COM-003 | 正常系 | ヘッダー | クリック可能状態 | 導線リンク | `ホーム->/home`, `履歴->/history`, `設定->/settings` を期待。未接続時は fail。 | SCR-COM-3.1-H |
| TC-UI-COM-004 | 正常系 | フッター | 共通レイアウトを描画 | フッター文言表示 | `利用規約/プライバシーポリシー/コピーライト` が表示される想定。未実装時は fail。 | SCR-COM-3.1-F |
| TC-UI-COM-005 | 正常系 | フッター | 共通レイアウトを描画 | フッターリンク | `利用規約` と `プライバシーポリシー` がリンクとして存在する想定。未接続時は fail。 | SCR-COM-3.1-F |
| TC-UI-COM-006 | 異常系 | 400表示 | `status=400, code=VALIDATION_ERROR` | 表示位置 | フィールド下インラインに表示される想定。トースト/画面上部のみ表示なら fail。 | SCR-COM-3.2-400, IF-002-ERR |
| TC-UI-COM-007 | 異常系 | 403表示 | `status=403, code=FORBIDDEN, message=アクセス権限がありません` | 表示位置/文言制約 | 画面上部インライン表示、内部詳細理由を含まない想定。詳細露出時は fail。 | SCR-COM-3.2-403, IF-COM-ERR |
| TC-UI-COM-008 | 異常系 | 409表示 | `status=409, code=DOMAIN_CONFLICT` | 表示方式 | トースト表示 + 必要時導線（再開/再読み込み）を表示想定。欠落時は fail。 | SCR-COM-3.2-409, IF-002-ERR |
| TC-UI-COM-009 | 異常系 | 500表示 | `status=500, code=INTERNAL_ERROR, trace_id=uuid` | 表示方式/trace_id | 共通文言トースト + `trace_id` 表示を想定。`trace_id` 欠落時は fail。 | SCR-COM-3.2-500, IF-COM-ERR |
| TC-UI-COM-010 | 境界値 | trace_id表示制御 | 400/403/409で `trace_id` を含む応答を投入 | 非表示制御 | 400/403/409では `trace_id` を表示しない想定。表示された場合 fail。 | SCR-COM-3.2-400,403,409 |
| TC-UI-COM-011 | 境界値 | trace_id表示制御 | 500で `trace_id` あり/なしを投入 | 表示条件 | 500で `trace_id` あり:表示、なし:文言のみ表示の想定。挙動不一致は fail。 | SCR-COM-3.2-500 |
| TC-UI-COM-012 | 境界値 | 403情報漏えい防止 | `message` に内部情報文字列を含む入力 | マスキング | 画面表示は共通文言に制限する想定。生文字列露出時は fail。 | SCR-COM-3.2-403 |

## 5. Red段階の期待値定義
- PR-002時点の実装対象テストは、少なくとも1件以上を失敗させる（`exit code 1`）ことでRedを固定する。
- 失敗メッセージには次を含める。
  - 期待DOM要素（例: `ホーム` リンク、`trace_id` 表示領域）
  - 期待表示方式（例: `403は画面上部インライン`）
  - 期待非表示条件（例: `400/403/409では trace_id 非表示`）

## 6. PR-002への引き継ぎ
- テストファイル候補
  - `tests/unit/ui/header.component.test.ts`
  - `tests/unit/ui/footer.component.test.ts`
  - `tests/unit/ui/error-display.component.test.ts`
- 最低実装対象
  - TC-UI-COM-001..012 をケース名に保持し、`SCR-COM-*` / `IF-*` をテスト名へ埋め込む。
