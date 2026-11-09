import { useLanguage } from '../../shared/i18n';
import SocialAvatar from './SocialAvatar';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
const avg = (n, locale) => Number(n || 0).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Pessoa numa lista (Pessoas, seguindo/seguidores): foto, nome e, embaixo, o
 * gosto parecido com o seu (com 3+ obras em comum) ou as obras e a média.
 * A ação (Comparar / Seguir) vem como filho, à direita.
 */
export default function PersonRow({ u, onOpen, children }) {
  const { t, locale } = useLanguage();
  const tp = t.social.people;
  return (
    <li className="social-person">
      <button type="button" className="social-person-main" onClick={() => onOpen(u.id)}>
        <SocialAvatar name={u.username} initials={u.initials} src={u.avatarSrc} size={36} />
        <span className="social-person-text">
          <span className="social-person-name">{u.username}</span>
          <span className="social-person-meta">
            {u.matchPct != null ? (
              <>
                <b className="social-match">{fmt(tp.match, { pct: u.matchPct })}</b>
                {' · '}
                {fmt(tp.inCommon, { n: u.sharedCount })}
              </>
            ) : (
              fmt(tp.stats, { works: u.stats.works, avg: avg(u.stats.avgScore, locale) })
            )}
          </span>
        </span>
      </button>
      {children}
    </li>
  );
}
