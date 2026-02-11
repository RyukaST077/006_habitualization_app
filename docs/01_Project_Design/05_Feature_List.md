# 機能一覧・画面／帳票一覧

## 0. ドキュメント管理
### 0.1 基本情報（システム名/プロジェクト名/作成者/作成日/承認者/版数）
| 項目 | 内容 |
| -- | -- |
| システム名 | HabiMake |
| プロジェクト名 | HabiMake MVP |
| 作成者 | Codex |
| 作成日 | 2026-02-11 |
| 承認者 | aliyell |
| 版数 | v0.1-draft |

### 0.2 改訂履歴
| 版 | 日付 | 改訂者 | 変更概要 | 関連チケット/議事録 |
| -- | -- | -- | -- | -- |
| v0.1-draft | 2026-02-11 | Codex | 初版（FR分解、ID採番、トレーサビリティ作成） | ゲート0回答 |
| v0.2-draft | 2026-02-11 | Codex | 非商用最小コスト運用を反映（Vercel Hobby + Supabase Free、Render不採用） | 追加方針反映 |

### 0.3 参照ドキュメント
| 種別 | ドキュメント名 | 版/URL | 備考 |
| -- | -- | -- | -- |
| 要件 | `docs/01_Project_Design/01_Requirements.md` | v0.4 | BREQ/FR/NFR/CON/AC |
| 業務 | `docs/01_Project_Design/02_Business_Process.md` | v0.4 | BP/BRL/EX/ROLE/SC |
| 設計 | `docs/01_Project_Design/03_Architecture.md` | v0.1-draft | ADR/構成/NFR実装方式 |
| 設計 | `docs/01_Project_Design/04_Basic_Design.md` | v0.1-draft | 機能構成/IF概要 |

## 1. 本ドキュメントの位置づけ
### 1.1 対象範囲（対象業務/チャネル/対象外）
- 対象業務：認証・同意、習慣管理、チェックイン、可視化、設定、退会、匿名KPI運用
- 対象チャネル：Web（スマホ中心）
- 対象外：通知多チャネル、課金、コミュニティ
- 運用前提：非商用用途、`Vercel Hobby + Supabase Free`、Render不採用

### 1.2 粒度の基準（機能/画面/帳票/ユースケース）
- 機能：FR群を業務価値単位でまとめた単位（FNC）
- 画面：UI単位（SCR）
- 帳票：運用/抽出単位（RPT）
- ユースケース：例外が多い複雑処理のみ（UC）

### 1.3 重複を避けるルール
- 本書はカタログ（台帳）とし、詳細仕様は別設計書に委譲する。
- 1機能は1つの主目的を持たせ、FR重複マッピングを避ける。
- 例外は `EX-ID` でリンクし、本文の重複説明を行わない。

## 2. 命名・採番ルール
### 2.1 ID体系（FNC-/SCR-/RPT-/UC-/IF-/BAT-）
| 区分 | 採番規則 | 例 |
| -- | -- | -- |
| 機能 | FNC-xxx | FNC-001 |
| 画面 | SCR-xxx | SCR-001 |
| 帳票 | RPT-xxx | RPT-001 |
| ユースケース | UC-xxx | UC-001 |
| 外部IF | IF-xxx | IF-001 |
| バッチ | BAT-xxx | BAT-001 |

### 2.2 ステータス定義（Draft/Reviewed/Approved/Implemented/Deprecated）
| ステータス | 定義 |
| -- | -- |
| Draft | 作成直後、未レビュー |
| Reviewed | レビュー完了、修正反映待ち含む |
| Approved | 合意済み、実装入力に利用可 |
| Implemented | 実装完了 |
| Deprecated | 廃止（後方互換維持含む） |

## 3. 機能一覧（Feature Catalog）
### 3.1 機能一覧テーブル
| 機能ID | 機能名 | 業務領域/モジュール | 概要 | 目的/KPI | トリガー | 主なアクター | 対象ロール/権限 | 前提条件 | 完了条件 | 主要データ | 画面ID | 帳票ID | IF/バッチID | 優先度(MoSCoW) | リスク/論点 | 非機能タグ | 受入条件/要件ID | ステータス | 備考 |
| -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- |
| FNC-001 | Google認証セッション確立 | 認証 | Google認証を行いセッション確立 | ログイン成功率 | ログイン操作 | 個人ユーザー | ROLE-001 | 未認証 | セッション確立 | auth.users, session | SCR-001 | - | IF-001 | Must | OAuth設定不備 | security, availability | FR-001, AC-001, BREQ-004 | Draft | SCR001互換 |
| FNC-002 | 同意判定・同意強制 | 認証/法務 | terms/privacyの最新版同意判定と未同意時制御 | 規約遵守 | 認証後 | 個人ユーザー | ROLE-001 | 認証済み | 同意済みでホーム遷移可 | policy_settings, policy_consents | SCR-008, SCR-002 | - | IF-002, IF-004 | Must | 規約改訂時の判定漏れ | security, audit | FR-002..FR-004, AC-002..004, CON-004/007 | Draft | EX-008/EX-011 |
| FNC-003 | 同意履歴管理 | 法務/監査 | policy_type単位で同意履歴を記録し一意性を担保 | 法務監査 | 同意操作 | 個人ユーザー、運用者 | ROLE-001/ROLE-002(監査参照) | 同意実行 | 重複なしで履歴記録 | policy_consents | SCR-008 | RPT-002 | IF-002 | Must | 一意制約不備 | audit, data_integrity | FR-005, AC-005, CON-006 | Draft | |
| FNC-004 | 習慣管理（作成/更新/アーカイブ/再開） | 習慣管理 | 習慣のライフサイクルを管理 | 初回達成率向上 | 作成/編集操作 | 個人ユーザー | ROLE-001 | 認証済み | status遷移完了 | habits | SCR-003, SCR-004, SCR-002 | - | IF-002 | Must | 他者データ更新防止 | security, usability | FR-006..FR-009, AC-006..009, BREQ-002 | Draft | EX-003/EX-004 |
| FNC-005 | 業務日付算出 | チェックイン | TZ+締め時刻で`log_date`算出 | 日付整合 | チェックイン操作 | システム | ROLE-001 | 設定値有効 | log_date確定 | profiles, habit_logs | SCR-002 | - | IF-002 | Must | 境界時刻バグ | correctness | FR-010, AC-010, BREQ-001 | Draft | EX-010 |
| FNC-006 | チェックイン登録・冪等・状態制御 | チェックイン | active習慣のみ達成登録、重複は冪等成功、archived拒否 | 週平均チェックイン向上 | 達成操作 | 個人ユーザー | ROLE-001 | active習慣 | 当日状態確定 | habits, habit_logs | SCR-002, SCR-004 | - | IF-002 | Must | 重複処理/状態不整合 | performance, idempotency | FR-011..FR-013, AC-011..013 | Draft | EX-005/EX-012 |
| FNC-007 | チェックイン取消 | チェックイン | `log_date`当日分のみ取消可 | 記録修正性 | 取消操作 | 個人ユーザー | ROLE-001 | 当日ログ存在 | 当日分のみ削除 | habit_logs | SCR-002 | - | IF-002 | Must | 当日判定ミス | correctness, audit | FR-014, AC-014 | Draft | EX-006 |
| FNC-008 | 継続可視化（ストリーク/履歴） | 可視化 | ストリーク計算と履歴表示（archived既定非表示） | 継続率向上 | 画面閲覧 | 個人ユーザー | ROLE-001 | 認証済み | 表示結果一致 | habits, habit_logs | SCR-002, SCR-005 | - | IF-002 | Must/Should | 表示誤解 | usability, performance | FR-015..FR-017, AC-015..017, BREQ-001/002 | Draft | BRL-014 |
| FNC-009 | 運用通知（閾値） | 運用 | 監視閾値でP1/P2通知を送信し、匿名KPI/監査ログをCLI/SQLで確認する | 障害検知迅速化 | 閾値超過/定期確認 | 運用者 | ROLE-002 | 監視設定済み | 通知送信と運用確認完了 | 監視メトリクス, analytics_daily_kpi, audit_logs | - | RPT-001, RPT-002 | IF-003, IF-005, BAT-003 | Should | P2ノイズ | operability, audit | FR-018, AC-018, CON-008 | Draft | MVPは画面非提供 |
| FNC-010 | 設定管理（TZ/締め時刻/検証） | 設定 | TZと締め時刻の変更、入力検証 | 個人最適化 | 設定保存 | 個人ユーザー | ROLE-001 | 認証済み | 設定保存成功 | profiles | SCR-007 | - | IF-002 | Should | 不正入力 | usability, correctness | FR-019..FR-021, AC-019..021, BREQ-005 | Draft | |
| FNC-011 | 設定変更監査 | 監査 | TZ/締め時刻変更の監査記録 | 監査適合 | 設定変更 | システム、運用者 | ROLE-001/ROLE-002 | 変更操作あり | 必須項目記録 | audit_logs | SCR-007 | RPT-002 | IF-002 | Should | 記録欠損 | audit | FR-022, AC-022, BRL-013 | Draft | |
| FNC-012 | 退会処理（不可化/削除） | アカウント | 退会後に利用不可化し個人データを削除 | データ保護 | 退会確定 | 個人ユーザー、システム | ROLE-001 | 認証済み | 参照不可化+完全削除 | profiles, habits, habit_logs, user_daily_activity, policy_consents, auth.users | SCR-007 | - | IF-002, IF-005, BAT-004 | Must | 部分失敗 | security, reliability | FR-023, FR-024, AC-023..024, CON-002 | Draft | 60秒/5分の二段階 |
| FNC-013 | アクセス制御・監査必須項目 | 共通基盤 | RLSで本人以外拒否し監査必須項目を記録 | セキュリティ保証 | 全操作 | システム、運用者 | ROLE-001/ROLE-002 | 認証済み | 不正アクセス拒否 + 監査記録 | 全個人データ, audit_logs | 全画面 | RPT-002 | IF-002 | Must | RLS不備 | security, audit | FR-025, FR-026, AC-025..026 | Draft | |

### 3.2 記入ガイド
- `受入条件/要件ID` は `FR` と `AC` を最低1つ以上記載する。
- `非機能タグ` は最低1つ（`performance/security/audit/operability/usability/correctness/idempotency`）を付与する。
- `IF/バッチID` は連携先が未確定でも `TBD` ではなく仮IDを先に採番し、課題化する。

## 4. 画面一覧（Screen Catalog）
### 4.1 画面一覧テーブル
| 画面ID | 画面名 | 種別 | 業務領域/モジュール | 目的 | 主な利用ロール | 入力/更新の有無 | 主な項目 | 参照/更新データ | 遷移元 | 遷移先 | 関連機能ID | 外部IF/バッチ | 非機能/セキュリティ観点 | 画面設計書リンク | ステータス | 備考 |
| -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- |
| SCR-001 | ログイン | 認証 | 認証 | Googleログイン開始 | ROLE-001 | 入力あり | Googleログインボタン | session | - | SCR-008, SCR-002 | FNC-001 | IF-001 | 認証失敗時制御 | TBD | Draft | 要件上: SCR001 |
| SCR-002 | ホーム（習慣一覧） | 一覧/操作 | チェックイン/可視化 | 当日チェックインとストリーク確認 | ROLE-001 | 更新あり | 習慣カード、達成、取消、ストリーク | habits, habit_logs | SCR-001, SCR-003, SCR-004, SCR-005, SCR-007 | SCR-003, SCR-004, SCR-005, SCR-007 | FNC-005, FNC-006, FNC-007, FNC-008 | IF-002 | P95<=3秒、二重送信防止 | TBD | Draft | 要件上: SCR002 |
| SCR-003 | 習慣作成 | 登録 | 習慣管理 | 新規習慣の登録 | ROLE-001 | 更新あり | 習慣名、並び順 | habits | SCR-002 | SCR-002 | FNC-004 | IF-002 | 入力検証 | TBD | Draft | 要件上: SCR003 |
| SCR-004 | 習慣編集 | 更新 | 習慣管理 | 習慣更新/アーカイブ/再開 | ROLE-001 | 更新あり | 習慣属性、状態変更 | habits | SCR-002 | SCR-002 | FNC-004, FNC-006 | IF-002 | RLS、状態整合 | TBD | Draft | 要件上: SCR004 |
| SCR-005 | 履歴/カレンダー | 一覧 | 可視化 | 履歴確認とarchived切替 | ROLE-001 | 条件入力あり | カレンダー、フィルタ | habit_logs, habits | SCR-002 | SCR-002 | FNC-008 | IF-002 | P95<=3秒 | TBD | Draft | 要件上: SCR005 |
| SCR-006 | 分析（ユーザー向け任意） | 参照 | 可視化 | 簡易統計表示（将来） | ROLE-001 | なし | 達成率、最長記録 | 匿名化済み統計 | SCR-002 | SCR-002 | FNC-008 | IF-002 | 認可/性能 | TBD | Draft | MVP任意 |
| SCR-007 | 設定 | 設定/更新 | 設定/退会 | TZ/締め時刻変更、退会 | ROLE-001 | 更新あり | timezone、day_cutoff_time、退会 | profiles, audit_logs | SCR-002 | SCR-002, SCR-001 | FNC-010, FNC-011, FNC-012 | IF-002, IF-005 | 監査ログ必須 | TBD | Draft | 要件上: SCR007 |
| SCR-008 | ポリシー同意 | 同意 | 法務 | 利用規約/PP同意 | ROLE-001 | 同意操作あり | terms/privacy、同意/拒否 | policy_settings, policy_consents | SCR-001 | SCR-002, SCR-001 | FNC-002, FNC-003 | IF-002, IF-004 | 同意未完了時アクセス制御 | TBD | Draft | 要件上: SCR008 |
### 4.2 画面分類（共通/業務/管理）
- 共通：SCR-001, SCR-008
- 業務：SCR-002, SCR-003, SCR-004, SCR-005, SCR-007
- 管理：なし（MVPはCLI/SQL運用）

## 5. 帳票一覧（Report Catalog）
### 5.1 帳票一覧テーブル
| 帳票ID | 帳票名 | 形式 | 出力タイミング | トリガー/条件 | 主要フィルタ/ソート | 出力対象データ | 出力先 | 保管/保持期間 | アクセス権限 | 関連機能ID | 画面ID | 帳票設計書リンク | 非機能/運用観点 | ステータス | 備考 |
| -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- |
| RPT-001 | 匿名KPI日次CSV | CSV | 手動/日次 | 運用者指示または日次実行 | 日付、metric_key | analytics_daily_kpi | DL/メール | 90日 | ROLE-002 | FNC-009 | - | TBD | 個人識別子非含有 | Draft | CLI/SQL運用で出力 |
| RPT-002 | 監査ログ抽出 | CSV | 手動 | 障害調査、監査対応 | 期間、action、result | audit_logs | DL | 90日 | ROLE-002 | FNC-003, FNC-011, FNC-013 | - | TBD | 改ざん防止方針要検討 | Draft | CLI/SQL運用で出力 |

## 6. ユースケース一覧（任意：複雑機能向け）
### 6.1 ユースケース一覧テーブル
| UC ID | UC名 | 主アクター | 目的 | 関連機能ID | 関連画面ID | 関連帳票ID | 関連IF/バッチ | 重要な業務ルール/例外 | 受入条件/要件ID | ステータス | 備考 |
| -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- |
| UC-001 | 初回同意と再同意 | ROLE-001 | 同意必須で利用制御 | FNC-001, FNC-002, FNC-003 | SCR-001, SCR-008 | - | IF-001, IF-004 | BRL-006, EX-008, EX-011 | FR-001..005, AC-001..005 | Draft | |
| UC-002 | 当日チェックインと取消 | ROLE-001 | 当日達成状態を正しく確定 | FNC-005, FNC-006, FNC-007 | SCR-002 | - | IF-002 | BRL-002, BRL-010, EX-005, EX-006, EX-012 | FR-010..014, AC-010..014 | Draft | |
| UC-003 | 退会処理 | ROLE-001 | 60秒以内不可化と削除完了 | FNC-012, FNC-013 | SCR-007 | RPT-002 | IF-005, BAT-004 | BRL-005, EX-007 | FR-023..026, AC-023..026 | Draft | |

### 6.2 ユースケース詳細テンプレ（目的/スコープ/アクター/基本フロー/代替・例外フロー）
- 目的：要件定義に対し、複雑例外の境界条件を明確化する。
- スコープ：1UCあたり1〜2ページの簡潔記述。
- アクター：主/副を明示し、権限IDを併記する。
- 基本フロー：5〜10ステップ程度。
- 代替・例外：`EX-ID` で参照し重複記述しない。

## 7. トレーサビリティ（マトリクス）
### 7.1 要件 -> 機能 対応表
| 要件ID | 要件名 | 機能ID | 備考 |
| -- | -- | -- | -- |
| BREQ-001 | 日次チェックイン継続 | FNC-005, FNC-006, FNC-007, FNC-008 | ストリーク/履歴含む |
| BREQ-002 | 習慣ライフサイクル管理 | FNC-004, FNC-006, FNC-008 | active/archived制御 |
| BREQ-003 | 個人データ保護と削除 | FNC-011, FNC-012, FNC-013 | RLS/監査/退会 |
| BREQ-004 | 同意制御 | FNC-001, FNC-002, FNC-003 | 初回/再同意 |
| BREQ-005 | TZ/締め時刻最適化 | FNC-005, FNC-010, FNC-011 | 変更以降適用 |
| BREQ-006 | 匿名KPI観測 | FNC-009 | 運用者限定 |
| FR-001..FR-026 | 機能要件全件 | FNC-001..FNC-013 | 下記対応表で詳細化 |
| NFR-001..NFR-008 | 非機能要件 | FNC-006, FNC-008, FNC-009, FNC-012, FNC-013 | タグ管理 |
| CON-001..CON-008 | 制約 | FNC-002, FNC-003, FNC-009, FNC-012, FNC-013 | 制約順守 |

### 7.2 機能 -> 画面/帳票/IF/バッチ 対応表
| 機能ID | 画面ID | 帳票ID | IF ID | バッチID | 備考 |
| -- | -- | -- | -- | -- | -- |
| FNC-001 | SCR-001 | - | IF-001 | - | 認証 |
| FNC-002 | SCR-008 | - | IF-002, IF-004 | - | 同意判定 |
| FNC-003 | SCR-008 | RPT-002 | IF-002, IF-005 | - | 同意履歴 |
| FNC-004 | SCR-003, SCR-004, SCR-002 | - | IF-002 | - | 習慣管理 |
| FNC-005 | SCR-002 | - | IF-002 | - | log_date算出 |
| FNC-006 | SCR-002, SCR-004 | - | IF-002 | - | チェックイン |
| FNC-007 | SCR-002 | - | IF-002 | - | 取消 |
| FNC-008 | SCR-002, SCR-005, SCR-006 | - | IF-002 | BAT-001 | 可視化 |
| FNC-009 | - | RPT-001, RPT-002 | IF-003, IF-005 | BAT-003 | 運用通知/CLI確認 |
| FNC-010 | SCR-007 | - | IF-002 | - | 設定 |
| FNC-011 | SCR-007 | RPT-002 | IF-002, IF-005 | - | 設定監査 |
| FNC-012 | SCR-007, SCR-001 | - | IF-005 | BAT-004 | 退会 |
| FNC-013 | 全画面 | RPT-002 | IF-002, IF-005 | - | RLS/監査 |

### 7.3 ロール（権限） -> 機能/画面 対応表
| ロール | 機能ID（実行可） | 画面ID（参照/更新） | 帳票ID（出力） | 備考 |
| -- | -- | -- | -- | -- |
| ROLE-001（個人ユーザー） | FNC-001..FNC-008, FNC-010..FNC-012 | SCR-001..SCR-008 | - | 本人データのみ |
| ROLE-002（運用者） | FNC-003, FNC-009, FNC-011, FNC-013 | - | RPT-001, RPT-002 | CLI/SQLで匿名KPI/監査のみ |

### 7.4 CRUDマトリクス
| エンティティ \ 機能ID | FNC-001 | FNC-002 | FNC-003 | FNC-004 | FNC-005 | FNC-006 | FNC-007 | FNC-008 | FNC-009 | FNC-010 | FNC-011 | FNC-012 | FNC-013 |
| -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- | -- |
| profiles | R | - | - | - | R | - | - | R | - | U | C | D | R |
| habits | - | - | - | C/R/U | R | R | - | R | - | - | - | D | R |
| habit_logs | - | - | - | - | R | C/R | D | R | - | - | - | D | R |
| user_daily_activity | - | - | - | - | - | - | - | - | R | - | - | D | R |
| analytics_daily_kpi | - | - | - | - | - | - | - | R | C/R/U | - | - | - | R |
| policy_consents | - | R | C/R | - | - | - | - | - | - | - | - | D | R |
| policy_settings | - | R | R | - | - | - | - | - | - | - | - | - | R/U |
| audit_logs | C | C | C | C | C | C | C | C | C | C | C | C | C/R |
| auth.users | C/R | - | - | - | - | - | - | - | - | - | - | D | R |

## 8. 非機能・セキュリティ観点（タグ付け）
### 8.1 推奨タグ一覧
| タグ | 意味 | 代表機能 |
| -- | -- | -- |
| performance | 応答時間/処理性能目標対象 | FNC-006, FNC-008 |
| availability | 可用性/SLO対象 | FNC-001, FNC-009 |
| security | 認証・認可・データ保護対象 | FNC-001, FNC-012, FNC-013 |
| audit | 監査証跡必須 | FNC-003, FNC-011, FNC-013 |
| idempotency | 冪等性設計必須 | FNC-006 |
| operability | 監視・運用対象 | FNC-009 |
| correctness | 業務ルール整合が重要 | FNC-005, FNC-007 |

## 9. 課題・確認事項・決定事項
### 9.1 オープン課題（Issue）
| ID | 内容 | 影響範囲（機能/画面/帳票） | 期限 | 担当 | 状態 |
| -- | -- | -- | -- | -- | -- |
| ISSUE-FL-001 | FR-023/AC-023を二段階削除定義へ追補 | FNC-012, UC-003 | 2026-02-20 | aliyell | Closed（2026-02-11） |
| ISSUE-FL-002 | SCR-009を画面化するかCLI運用にするか確定 | FNC-009, RPT-001 | 2026-03-01 | aliyell | Closed（CLI/SQL運用） |
| ISSUE-FL-003 | 本番リージョン最終決定 | 全体 | 2026-02-20 | aliyell | Open |
| ISSUE-FL-004 | Free/Hobby上限到達時の有償化判断基準を定義 | FNC-009, FNC-012 | 2026-03-01 | aliyell | Open |

### 9.2 決定事項（Decision Log）
| 日付 | 決定事項 | 理由 | 代替案 | 影響範囲 |
| -- | -- | -- | -- | -- |
| 2026-02-11 | 技術選定優先順位は開発スピード最優先 | 4/1リリース優先 | コスト最優先/スケール最優先 | 全体 |
| 2026-02-11 | チーム経験は低め前提で設計 | リスク低減 | 高経験前提 | 全体 |
| 2026-02-11 | TypeScript全面採用 | 回帰バグ低減 | 一部JS | 全体 |
| 2026-02-11 | 退会削除は二段階運用 | 可用性と削除保証の両立 | 完全同期60秒 | FNC-012 |
| 2026-02-11 | KPI実装はEdge Functions優先+Trigger併用 | 実装容易性 | Triggerのみ/Functionsのみ | FNC-009 |
| 2026-02-11 | FR-023/AC-023/NFR-005を二段階削除定義へ更新 | 要件と運用実態を整合 | 旧定義（60秒完全削除） | FNC-012, UC-003 |
| 2026-02-11 | 運用KPIは管理画面を作らずCLI/SQL運用とする | MVP開発速度優先 | SCR-009新設 | FNC-009, RPT-001, RPT-002 |
| 2026-02-11 | ランニングコスト最小化のためVercel Hobby + Supabase Free、Render不採用を採用 | 個人開発の固定費最小化 | Proプラン前提構成 | 全体 |

## 10. 付録
### 10.1 用語集
| 用語 | 定義 | 備考 |
| -- | -- | -- |
| 冪等 | 同じ操作を複数回行っても結果が不変である性質 | FR-012 |
| 業務日付 | TZと締め時刻から算出される対象日 | FR-010 |
| 二段階削除 | 60秒以内の不可化後に5分以内の完全削除を完了させる方式 | ADR-003 |

### 10.2 チェックリスト（レビュー観点）
- [x] FR-001..FR-026 がFNCに紐づいている
- [x] 主要ロールの権限が定義されている
- [x] 画面ID/IF-ID/BAT-ID を採番済み
- [x] 監査・セキュリティタグが付与されている
- [x] 退会/同意/RLSの高リスク領域を課題管理している

### 10.3 運用のコツ
- 仕様変更は「要件 -> 機能 -> 画面/IF/バッチ -> テスト」の順で更新する。
- 新規機能追加時は先にID採番し、未確定項目はTBDで期限を置く。
- 月次レビューで `Issue` と `Decision Log` を更新する。
