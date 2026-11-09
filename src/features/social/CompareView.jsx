import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Scale } from 'lucide-react';
import { useUnifiedItems } from '../../shared/useUnifiedItems';
import { useLanguage } from '../../shared/i18n';
import { socialApi, computeTasteMatch, normTitle, typeIconFor } from './socialData';
import SocialAvatar from './SocialAvatar';
import SocialEmpty from './SocialEmpty';

/**
 * Você × outra pessoa: o resumo (em comum, gosto parecido, favoritos em comum
 * e a maior discordância) e a lista lado a lado. Abre só com as obras em
 * comum, que é o que interessa; "Todas" mostra também as que só um avaliou.
 */
export default function CompareView({ userId, onBack, onOpenUser }) {
  const { t, locale } = useLanguage();
  const tc = t.social.compare;
  const [friend, setFriend] = useState(null);
  const [onlyShared, setOnlyShared] = useState(true);
  const { items: myItems, loading } = useUnifiedItems();

  useEffect(() => {
    let alive = true;
    socialApi.getProfile(userId)
      .then((p) => { if (alive) setFriend(p); })
      .catch(() => { if (alive) setFriend(false); });
    return () => { alive = false; };
  }, [userId]);

  const rows = useMemo(() => {
    if (!friend || !myItems) return [];
    const mine = new Map(myItems.map((i) => [normTitle(i.title), i]));
    const theirs = new Map(friend.works.map((w) => [normTitle(w.title), w]));
    return [...new Set([...mine.keys(), ...theirs.keys()])]
      .map((key) => {
        const m = mine.get(key);
        const th = theirs.get(key);
        const myScore = m ? Number(m.note) : null;
        const theirScore = th ? Number(th.score) : null;
        return {
          key,
          title: th?.title || m?.title || key,
          type: th?.type || m?.type || 'outro',
          imageUrl: th?.imageUrl || null,
          mine: myScore,
          theirs: theirScore,
          diff: myScore != null && theirScore != null ? +(myScore - theirScore).toFixed(1) : null,
        };
      })
      .sort((a, b) => {
        const shared = (r) => (r.diff != null ? 0 : 1);
        return shared(a) - shared(b) || (b.theirs ?? b.mine ?? 0) - (a.theirs ?? a.mine ?? 0);
      });
  }, [friend, myItems]);

  const match = useMemo(
    () => (friend && myItems ? computeTasteMatch(myItems, friend.works) : null),
    [friend, myItems],
  );

  const note = (n) => Number(n).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const back = (
    <button type="button" className="social-back" onClick={onBack}>
      <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
      {tc.back}
    </button>
  );

  if (friend === false) return <div className="social-sub">{back}<p className="social-rail-empty">{tc.notFound}</p></div>;
  if (!friend || loading || friend.id !== Number(userId)) {
    return <div className="social-sub">{back}<p className="social-rail-empty">{tc.loading}</p></div>;
  }

  const gap = match.disagreements[0];
  const shown = onlyShared ? rows.filter((r) => r.diff != null) : rows;
  const stats = [
    { value: match.sharedCount, label: tc.sharedWorks },
    { value: match.matchPct == null ? '—' : `${match.matchPct}%`, label: tc.affinity, gold: match.matchPct != null },
    { value: match.favorites.length, label: tc.sharedFavs },
    { value: gap ? note(Math.abs(gap.diff)) : '—', label: tc.biggestGap, hint: gap?.title },
  ];

  return (
    <div className="social-sub">
      {back}

      <div className="social-cmp-head">
        <span className="social-cmp-you">{tc.you}</span>
        <span className="social-muted">×</span>
        <button type="button" className="social-cmp-friend" onClick={() => onOpenUser?.(friend.id)}>
          <SocialAvatar name={friend.username} initials={friend.initials} src={friend.avatarSrc} size={28} />
          <span>{friend.username}</span>
        </button>
      </div>

      <div className="social-cmp-stats">
        {stats.map((s) => (
          <div key={s.label} className="mr-panel social-cmp-stat">
            <b className={s.gold ? 'is-gold' : undefined}>{s.value}</b>
            <span>{s.label}</span>
            {s.hint && <small title={s.hint}>{s.hint}</small>}
          </div>
        ))}
      </div>

      <section className="mr-panel social-col">
        <div className="social-cmp-bar">
          <div className="social-cmp-filter" role="group">
            <button type="button" className={onlyShared ? 'is-active' : ''} aria-pressed={onlyShared} onClick={() => setOnlyShared(true)}>
              {tc.filterShared}
            </button>
            <button type="button" className={onlyShared ? '' : 'is-active'} aria-pressed={!onlyShared} onClick={() => setOnlyShared(false)}>
              {tc.filterAll}
            </button>
          </div>
          <span className="social-cmp-cols" aria-hidden="true">
            <span>{tc.you}</span>
            <span title={friend.username}>{friend.username}</span>
            <span>Δ</span>
          </span>
        </div>

        {shown.length === 0 ? (
          <SocialEmpty compact icon={Scale} text={tc.noData} />
        ) : (
          <ul className="social-cmp-list">
            {shown.map((r) => (
              <li key={r.key} className="social-cmp-row">
                <span className="social-prof-cover">
                  {r.imageUrl
                    ? <img src={r.imageUrl} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    : typeIconFor(r.type, 14)}
                </span>
                <span className="social-prof-title">{r.title}</span>
                <span className="social-cmp-mine">{r.mine == null ? '—' : note(r.mine)}</span>
                <span className="social-cmp-theirs">{r.theirs == null ? '—' : note(r.theirs)}</span>
                <span className={`social-cmp-diff${r.diff > 0 ? ' is-up' : r.diff < 0 ? ' is-down' : ''}`}>
                  {r.diff == null ? '—' : `${r.diff > 0 ? '+' : ''}${note(r.diff)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
