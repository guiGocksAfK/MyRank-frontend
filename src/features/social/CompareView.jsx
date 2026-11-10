import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Scale } from 'lucide-react';
import { useUnifiedItems } from '../../shared/useUnifiedItems';
import { useLanguage } from '../../shared/i18n';
import { useUser } from '../../shared/userContext';
import { socialApi, computeTasteMatch, tasteKey, typeIconFor } from './socialData';
import SocialAvatar from './SocialAvatar';
import SocialEmpty from './SocialEmpty';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
/** A partir dessa diferença, a briga fica vermelha (mesma do feed). */
const CLASH_GAP = 2;
/** "Recomenda": o que a outra pessoa deu pelo menos isso e você não avaliou. */
const REC_MIN = 9;

function Cover({ w, size = 14 }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const src = w?.imageUrl;
  return (
    <span className="social-prof-cover">
      {src && failedSrc !== src
        ? <img src={src} alt="" loading="lazy" onError={() => setFailedSrc(src)} />
        : typeIconFor(w?.type, size)}
    </span>
  );
}

/**
 * Você × outra pessoa. Em cima, a % entre as duas; depois onde vocês batem,
 * onde brigam e o que ela recomenda (nota alta que você ainda não avaliou); e a
 * lista com uma régua por obra: a sua nota em dourado, a dela em branco.
 */
export default function CompareView({ userId, onBack, onOpenUser }) {
  const { t, locale } = useLanguage();
  const tc = t.social.compare;
  const { user } = useUser();
  const [friend, setFriend] = useState(null);
  const [view, setView] = useState('diff'); // diff | same | theirs | mine
  const { items: myItems, loading } = useUnifiedItems();

  useEffect(() => {
    let alive = true;
    socialApi.getProfile(userId)
      .then((p) => { if (alive) setFriend(p); })
      .catch(() => { if (alive) setFriend(false); });
    return () => { alive = false; };
  }, [userId]);

  // uma linha por obra (pelo título): as duas notas, ou só uma
  const rows = useMemo(() => {
    if (!friend || !myItems) return [];
    // mesma chave da conta: título + tipo
    const mine = new Map(myItems.filter((i) => i.title).map((i) => [tasteKey(i.title, i.type), i]));
    const theirs = new Map(friend.works.filter((w) => w.title).map((w) => [tasteKey(w.title, w.type), w]));
    return [...new Set([...mine.keys(), ...theirs.keys()])].map((key) => {
      const m = mine.get(key);
      const th = theirs.get(key);
      const myScore = m && Number.isFinite(Number(m.note)) ? Number(m.note) : null;
      const theirScore = th && th.score != null ? Number(th.score) : null;
      return {
        key,
        title: th?.title || m?.title,
        type: th?.type || m?.type || 'outro',
        imageUrl: th?.imageUrl || m?.image || null,
        mine: myScore,
        theirs: theirScore,
        diff: myScore != null && theirScore != null ? +(myScore - theirScore).toFixed(1) : null,
      };
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

  const name = friend.username;
  const shared = rows.filter((r) => r.diff != null);
  const gapOf = (r) => Math.abs(r.diff);
  // batem: menor diferença, e entre empates as notas mais altas
  const agree = [...shared].sort((a, b) => gapOf(a) - gapOf(b) || (b.mine + b.theirs) - (a.mine + a.theirs)).slice(0, 3);
  const fight = [...shared].sort((a, b) => gapOf(b) - gapOf(a))[0];
  const recs = rows.filter((r) => r.mine == null && r.theirs >= REC_MIN).sort((a, b) => b.theirs - a.theirs).slice(0, 4);
  const myNotes = myItems.map((i) => Number(i.note)).filter((n) => n > 0);
  const myAvg = myNotes.length ? myNotes.reduce((s, n) => s + n, 0) / myNotes.length : 0;

  const lists = {
    diff: [...shared].sort((a, b) => gapOf(b) - gapOf(a)),
    same: [...shared].sort((a, b) => gapOf(a) - gapOf(b)),
    theirs: rows.filter((r) => r.mine == null && r.theirs != null).sort((a, b) => b.theirs - a.theirs),
    mine: rows.filter((r) => r.theirs == null && r.mine != null).sort((a, b) => b.mine - a.mine),
  };
  const shown = lists[view];
  // a régua começa um pouco abaixo da menor nota (no máximo em 5), pra não espremer tudo no fim
  const all = shown.flatMap((r) => [r.mine, r.theirs]).filter((n) => n != null);
  const scaleMin = Math.max(0, Math.min(5, Math.floor(Math.min(...all, 10))));
  const pos = (n) => `${((n - scaleMin) / (10 - scaleMin)) * 100}%`;

  const VIEWS = [
    { id: 'diff', label: tc.sortDiff },
    { id: 'same', label: tc.sortSame },
    { id: 'theirs', label: fmt(tc.onlyTheirs, { name }) },
    { id: 'mine', label: tc.onlyMine },
  ];

  return (
    <div className="social-sub">
      {back}

      {/* frente a frente: você, a %, a outra pessoa */}
      <section className="mr-panel social-cmp-hero">
        <div className="social-cmp-side">
          <SocialAvatar name={user?.username || '?'} src={user?.avatarUrl} size={44} />
          <span className="social-cmp-who">
            <b className="is-you">{tc.you}</b>
            <small>{fmt(tc.avgOf, { avg: note(myAvg) })}</small>
          </span>
        </div>
        <div className="social-cmp-center">
          <b className="social-cmp-pct">{match.matchPct == null ? '—' : `${match.matchPct}%`}</b>
          <span className="social-cmp-pct-label">{tc.matchLabel}</span>
          <span className="social-cmp-summary">
            {fmt(tc.summary, { n: match.sharedCount, f: match.favorites.length })}
          </span>
        </div>
        <button type="button" className="social-cmp-side is-right" onClick={() => onOpenUser?.(friend.id)}>
          <span className="social-cmp-who">
            <b>{name}</b>
            <small>{fmt(tc.avgOf, { avg: note(friend.stats.avgScore) })}</small>
          </span>
          <SocialAvatar name={name} initials={friend.initials} src={friend.avatarSrc} size={44} />
        </button>
      </section>

      {/* os três destaques */}
      <div className="social-cmp-highlights">
        <section className="mr-panel social-col">
          <h2 className="social-rail-title">{tc.agreeTitle}</h2>
          {agree.length === 0 ? (
            <p className="social-rail-empty">{tc.noData}</p>
          ) : (
            <>
              <div className="social-cmp-covers">{agree.map((r) => <Cover key={r.key} w={r} size={16} />)}</div>
              <p className="social-cmp-caption">
                {fmt(tc.agreeLine, { title: agree[0].title, a: note(agree[0].mine), b: note(agree[0].theirs) })}
              </p>
            </>
          )}
        </section>

        <section className="mr-panel social-col">
          <h2 className="social-rail-title">{tc.fightTitle}</h2>
          {!fight || gapOf(fight) < 1 ? (
            <p className="social-rail-empty">{shared.length ? tc.noFight : tc.noData}</p>
          ) : (
            <div className="social-cmp-fight">
              <Cover w={fight} size={16} />
              <span className="social-pick-text">
                <span className="social-pick-title">{fight.title}</span>
                <span className="social-cmp-fight-scores">
                  <b className="social-cmp-mine">{note(fight.mine)}</b>
                  <span className="social-muted">×</span>
                  <b>{note(fight.theirs)}</b>
                  <span className="social-cmp-diff is-down">{note(gapOf(fight))}</span>
                </span>
              </span>
            </div>
          )}
        </section>

        <section className="mr-panel social-col is-rec">
          <h2 className="social-rail-title">{fmt(tc.recTitle, { name })}</h2>
          {recs.length === 0 ? (
            <p className="social-rail-empty">{fmt(tc.noRec, { name })}</p>
          ) : (
            <>
              <div className="social-cmp-covers">
                {recs.map((r) => <span key={r.key} title={`${r.title} · ${note(r.theirs)}`}><Cover w={r} size={16} /></span>)}
              </div>
              <p className="social-cmp-caption">{tc.recHint}</p>
            </>
          )}
        </section>
      </div>

      {/* a lista: uma régua por obra */}
      <section className="mr-panel social-col">
        <div className="social-cmp-filter" role="group">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" className={view === v.id ? 'is-active' : ''} aria-pressed={view === v.id}
              onClick={() => setView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <SocialEmpty compact icon={Scale} text={tc.noData} />
        ) : (
          <>
            <ul className="social-cmp-list">
              {shown.map((r) => {
                const both = r.diff != null;
                const lo = both ? Math.min(r.mine, r.theirs) : null;
                const hi = both ? Math.max(r.mine, r.theirs) : null;
                const clash = both && gapOf(r) >= CLASH_GAP;
                const one = r.mine ?? r.theirs;
                return (
                  <li key={r.key} className="social-cmp-row">
                    <Cover w={r} />
                    <span className="social-prof-title">{r.title}</span>
                    <span
                      className="social-cmp-ruler"
                      role="img"
                      aria-label={both
                        ? fmt(tc.rulerBoth, { you: note(r.mine), name, them: note(r.theirs) })
                        : note(one)}
                    >
                      <span className="social-cmp-track" />
                      {both && (
                        <span
                          className={`social-cmp-gap${clash ? ' is-clash' : ''}`}
                          style={{ left: pos(lo), width: `calc(${pos(hi)} - ${pos(lo)})` }}
                        />
                      )}
                      {r.theirs != null && <span className="social-cmp-dot is-theirs" style={{ left: pos(r.theirs) }} />}
                      {r.mine != null && <span className="social-cmp-dot is-mine" style={{ left: pos(r.mine) }} />}
                    </span>
                    <span className={`social-cmp-diff${clash ? ' is-down' : ''}`}>
                      {both ? note(gapOf(r)) : note(one)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="social-cmp-legend">
              <span><i className="social-cmp-key is-mine" />{tc.you}</span>
              <span><i className="social-cmp-key is-theirs" />{name}</span>
            </p>
          </>
        )}
      </section>
    </div>
  );
}
