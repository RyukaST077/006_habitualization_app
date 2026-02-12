const COMMON_FOOTER_ARIA_LABEL = '共通フッター';

export function AppFooter() {
  return (
    <footer>
      <nav aria-label={COMMON_FOOTER_ARIA_LABEL}>
        <a href="/terms">利用規約</a>
        <a href="/privacy">プライバシーポリシー</a>
      </nav>
      <small>コピーライト</small>
    </footer>
  );
}
