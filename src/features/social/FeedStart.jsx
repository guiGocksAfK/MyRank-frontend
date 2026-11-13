import { useEffect, useState } from 'react';
import { useLanguage } from '../../shared/i18n';
import { socialApi, looksLikeMe } from './socialData';
import SocialAvatar from './SocialAvatar';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
const SHOWN = 4;

/**
 * Feed vazio: em vez de só avisar, já mostra quem tem o gosto parecido com o
 * seu pra seguir ali mesmo. Seguiu alguém, o feed recarrega (`onFollowed`).
 * Sem ninguém pra sugerir, fica só o convite.
 */
export default function FeedStart({ onOpenUser, onGoPeople, onFollowed }) {
  const { t, locale } = useLanguage();
  const tf = t.social.feed;
  const tp = t.social.people;
  const [people, setPeople] = useState(null);

  useEffect(() => {
    let alive = true;
    socialApi.getSuggestions()
      .then((list) => { if (alive) setPeople(list.filter(looksLikeMe).slice(0, SHOWN)); })
      .catch(() => { if (alive) setPeople([]); });
    return () => { alive = false; };
  }, []);

  const follow = async (id) => {
    try {
      const u = await socialApi.toggleFollow(id);
      setPeople((list) => list.map((p) => (p.id === id ? { ...p, following: u.following, requested: u.requested } : p)));
      if (u.following) onFollowed?.();
    } catch {
      /* silencioso */
    }
  };

  const avg = (n) => Number(n || 0).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  if (people === null) return null;
  if (people.length === 0) {
    return (
      <section className="mr-panel social-start">
        <h2 className="social-start-title">{tf.startTitle}</h2>
        <p className="social-start-text">{tf.nobodyYet}</p>
      </section>
    );
  }

  return (
    <section className="mr-panel social-start">
      <h2 className="social-start-title">{tf.startTitle}</h2>
      <p className="social-start-text">{tf.startText}</p>
      <ul className="social-start-grid">
        {people.map((u) => (
          <li key={u.id} className="social-start-card">
            <button type="button" className="social-start-who" onClick={() => onOpenUser?.(u.id)}>
              <SocialAvatar name={u.username} initials={u.initials} src={u.avatarSrc} size={48} />
              <span className="social-person-name">{u.username}</span>
              {u.matchPct != null ? (
                <span className="social-start-meta">
                  <span><b className="social-match">{u.matchPct}%</b> {tp.matchWord}</span>
                  <span>{fmt(tp.inCommon, { n: u.sharedCount })}</span>
                </span>
              ) : (
                <span className="social-start-meta">
                  <span>{fmt(tp.stats, { works: u.stats.works, avg: avg(u.stats.avgScore) })}</span>
                </span>
              )}
            </button>
            <button
              type="button"
              className={`social-chip-btn${u.following || u.requested ? '' : ' is-gold'}`}
              onClick={() => follow(u.id)}
            >
              {u.following ? t.social.profile.following : u.requested ? tp.requested : u.isPublic === false ? tp.request : tp.follow}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="social-rail-more" onClick={onGoPeople}>{tf.emptyCta}</button>
    </section>
  );
}
