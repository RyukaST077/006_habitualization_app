import { HOME_TRANSITION_LINKS } from '../../client/routing/transition-map';

export default function HomePage() {
  return (
    <main>
      <h1>SCR-002 ホーム</h1>
      <p>/home</p>
      <nav aria-label="SCR-002 normal transitions">
        <ul>
          {HOME_TRANSITION_LINKS.map((link) => (
            <li key={`${link.from}-${link.to}`}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
