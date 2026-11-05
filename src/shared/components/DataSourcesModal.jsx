import { ArrowUpRight } from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '../i18n';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

// De onde vêm os dados das obras (e a IA). Nome e site não traduzem; o resto vem do i18n.
const SOURCES = [
  { key: 'tmdb', name: 'TMDB', site: 'themoviedb.org', url: 'https://www.themoviedb.org' },
  { key: 'rawg', name: 'RAWG', site: 'rawg.io', url: 'https://rawg.io' },
  { key: 'mal', name: 'MyAnimeList', site: 'myanimelist.net', url: 'https://myanimelist.net' },
  { key: 'books', name: 'Google Books', site: 'books.google.com', url: 'https://books.google.com' },
  { key: 'deezer', name: 'Deezer', site: 'deezer.com', url: 'https://www.deezer.com' },
  { key: 'itunes', name: 'iTunes', site: 'apple.com', url: 'https://www.apple.com/itunes/' },
  { key: 'gemini', name: 'Google Gemini', site: 'ai.google.dev', url: 'https://ai.google.dev' },
];

/**
 * "Fontes dos dados", aberto pelo rodapé. Também cumpre a atribuição que os
 * termos do TMDB pedem (o aviso no fim).
 */
export default function DataSourcesModal({ onClose }) {
  const { t } = useLanguage();
  const ts = t.home.sources;

  return (
    <Modal title={ts.title} onClose={onClose} width={560}>
      <p className="ds-intro">{ts.intro}</p>
      <ul className="ds-list">
        {SOURCES.map((s) => (
          <li key={s.key} className="ds-item">
            <div className="ds-head">
              <strong>{s.name}</strong>
              <span className="ds-scope">{ts[s.key].scope}</span>
              <a className="ds-link" href={s.url} target="_blank" rel="noopener noreferrer"
                aria-label={fmt(ts.open, { name: s.name })}>
                {s.site}
                <ArrowUpRight size={13} strokeWidth={2} aria-hidden="true" />
              </a>
            </div>
            <p className="ds-desc">{ts[s.key].desc}</p>
          </li>
        ))}
      </ul>
      <p className="ds-notice">{ts.tmdbNotice}</p>
    </Modal>
  );
}
