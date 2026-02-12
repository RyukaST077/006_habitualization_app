const COMMON_HEADER_ARIA_LABEL = '共通ヘッダー';

export function AppHeader() {
  return (
    <header>
      <nav aria-label={COMMON_HEADER_ARIA_LABEL}>
        <ul>
          <li>
            <a href="/home">ロゴ</a>
          </li>
          <li>
            <a href="/home">ホーム</a>
          </li>
          <li>
            <a href="/history">履歴</a>
          </li>
          <li>
            <a href="/settings">設定</a>
          </li>
          <li>
            <button type="button">ログアウト</button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
