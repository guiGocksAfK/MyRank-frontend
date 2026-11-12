import { useEffect, useMemo, useState } from 'react';
import { Check, UserPlus, X } from 'lucide-react';
import { useLanguage } from '../../shared/i18n';
import { useUser } from '../../shared/userContext';
import { socialApi, tasteKey, typeIconFor, DEBATE_MAX_PCT } from './socialData';
import SocialAvatar from './SocialAvatar';
import YouCard from './YouCard';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
/** Quantas obras o "Em alta" mostra, e quantas pessoas uma obra precisa pra entrar. */
const TRENDING_MAX = 3;
const TRENDING_MIN_PEOPLE = 2;

function TrendCover({ work }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const src = work?.imageUrl;
  return (
    <span className="social-prof-cover">
      {src && failedSrc !== src
        ? <img src={src} alt="" loading="lazy" onError={() => setFailedSrc(src)} />
        : typeIconFor(work?.type, 14)}
    </span>
  );
}

/**
 * As obras que mais aparecem no que o feed já carregou (takes e avaliações do
 * dia), contando pessoas diferentes, com a média das notas delas.
 */
function trendingFrom(items, myUsername) {
  const byTitle = new Map();
  (items || []).forEach((it) => {
    if (!it.actor || it.actor.username === myUsername) return;
    const works = it.type === 'RATED_DAY' ? it.works : it.work ? [it.work] : [];
    works.forEach((w) => {
      if (!w?.title || w.score == null) return;
      const key = tasteKey(w.title, w.type);
      const entry = byTitle.get(key) || { work: w, scores: new Map() };
      // a nota mais recente de cada pessoa (o feed vem do mais novo pro mais velho)
      if (!entry.scores.has(it.actor.id)) entry.scores.set(it.actor.id, Number(w.score));
      if (!entry.work.imageUrl && w.imageUrl) entry.work = w;
      byTitle.set(key, entry);
    });
  });
  return [...byTitle.values()]
    .map(({ work, scores }) => {
      const list = [...scores.values()];
      return { work, people: list.length, avg: list.reduce((a, b) => a + b, 0) / list.length };
    })
    .filter((x) => x.people >= TRENDING_MIN_PEOPLE)
    .sort((a, b) => b.people - a.people || b.avg - a.avg)
    .slice(0, TRENDING_MAX);
}

/**
 * Trilho direito do Feed: você numa linha, os pedidos pra te seguir (só quando
 * há), quem tem o gosto mais parecido com o seu e o que está em alta entre
 * quem você segue. `feedItems`: o que o feed já carregou.
 */
export default function SocialRail({
  feedItems, activeTrend, onPickTrend, onOpenConnections, onOpenUser, onGoPeople, youKey, onCountsChanged,
}) {
  const { t, locale } = useLanguage();
  const tr = t.social.rail;
  const tp = t.social.people;
  const { user } = useUser();
  const [suggestions, setSuggestions] = useState(null);
  const [requests, setRequests] = useState([]);
  const [debaters, setDebaters] = useState([]);

  useEffect(() => {
    socialApi.getSuggestions().then((r) => setSuggestions(r.filter((u) => u.matchPct > DEBATE_MAX_PCT).slice(0, 3))).catch(() => setSuggestions([]));
    socialApi.getFollowRequests().then(setRequests).catch(() => setRequests([]));
    socialApi.getDebaters().then((r) => setDebaters(r.slice(0, 2))).catch(() => setDebaters([]));
  }, []);

  const trending = useMemo(() => trendingFrom(feedItems, user?.username), [feedItems, user?.username]);
  const note = (n) => Number(n).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const resolveRequest = async (id, accept) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    try {
      if (accept) await socialApi.approveFollowRequest(id);
      else await socialApi.rejectFollowRequest(id);
      onCountsChanged?.();
    } catch {
      socialApi.getFollowRequests().then(setRequests).catch(() => {});
    }
  };

  const followSuggestion = async (id) => {
    try {
      const u = await socialApi.toggleFollow(id);
      setSuggestions((prev) =>
        (prev || [])
          .filter((s) => s.id !== id || !u.following) // some da lista quando vira "seguindo"
          .map((s) => (s.id === id ? { ...s, requested: u.requested, following: u.following } : s)),
      );
      onCountsChanged?.();
    } catch {
      /* silencioso */
    }
  };

  return (
    <aside className="social-rail">
      {/* em tela grande o "Você" fica na coluna da esquerda */}
      <YouCard className="is-rail" onOpenUser={onOpenUser} onOpenConnections={onOpenConnections} refreshKey={youKey} />

      {requests.map((u) => (
        <section key={u.id} className="mr-panel social-rail-request">
          <UserPlus size={16} strokeWidth={1.8} aria-hidden="true" />
          <span className="social-rail-request-text">
            <button type="button" className="social-link" onClick={() => onOpenUser?.(u.id)}>{u.username}</button>
            {' '}{tr.wantsToFollow}
          </span>
          <button type="button" className="social-icon-btn is-gold" aria-label={tr.accept} title={tr.accept}
            onClick={() => resolveRequest(u.id, true)}>
            <Check size={15} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <button type="button" className="social-icon-btn" aria-label={tr.decline} title={tr.decline}
            onClick={() => resolveRequest(u.id, false)}>
            <X size={15} strokeWidth={2} aria-hidden="true" />
          </button>
        </section>
      ))}

      {/* no celular some: as sugestões já estão na aba Pessoas */}
      {suggestions?.length > 0 && (
        <section className="mr-panel social-rail-card is-side">
          <h2 className="social-rail-title">{tr.mostLikeYou}</h2>
          <ul className="social-rail-list">
            {suggestions.map((u) => (
              <li key={u.id} className="social-rail-match">
                <button type="button" className="social-rail-match-main" onClick={() => onOpenUser?.(u.id)}>
                  <b className="social-rail-pct">{u.matchPct}%</b>
                  <SocialAvatar name={u.username} initials={u.initials} src={u.avatarSrc} size={28} />
                  <span className="social-person-name">{u.username}</span>
                </button>
                <button
                  type="button"
                  className={`social-chip-btn${u.requested ? '' : ' is-gold'}`}
                  onClick={() => followSuggestion(u.id)}
                >
                  {u.requested ? tp.requested : u.isPublic === false ? tp.request : tp.follow}
                </button>
                <span className="social-rail-bar" aria-hidden="true"><span style={{ width: `${u.matchPct}%` }} /></span>
              </li>
            ))}
          </ul>
          <button type="button" className="social-rail-more" onClick={onGoPeople}>{tr.seeAll}</button>
        </section>
      )}

      {debaters.length > 0 && (
        <section className="mr-panel social-rail-card is-side">
          <h2 className="social-rail-title">{tp.debate}</h2>
          <ul className="social-rail-list">
            {debaters.map((u) => (
              <li key={u.id} className="social-rail-match">
                <button type="button" className="social-rail-match-main" onClick={() => onOpenUser?.(u.id)}>
                  <b className="social-rail-pct is-clash">{u.matchPct}%</b>
                  <SocialAvatar name={u.username} initials={u.initials} src={u.avatarSrc} size={28} />
                  <span className="social-person-text">
                    <span className="social-person-name">{u.username}</span>
                    {u.fight && <span className="social-person-meta">{fmt(tp.debateShort, { title: u.fight.title })}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="social-rail-more" onClick={onGoPeople}>{tr.seeAll}</button>
        </section>
      )}

      {trending.length > 0 && (
        <section className="mr-panel social-rail-card is-side">
          <h2 className="social-rail-title">{tr.trending}</h2>
          <ul className="social-rail-list">
            {trending.map(({ work, people, avg }) => {
              const key = tasteKey(work.title, work.type);
              const active = activeTrend === key;
              return (
                <li key={key}>
                  {/* clicar filtra o feed por essa obra; clicar de novo tira o filtro */}
                  <button
                    type="button"
                    className={`social-rail-trend${active ? ' is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => onPickTrend?.(active ? null : { key, title: work.title })}
                  >
                    <TrendCover work={work} />
                    <span className="social-pick-text">
                      <span className="social-pick-title">{work.title}</span>
                      <span className="social-pick-type">{fmt(tr.trendingLine, { n: people, avg: note(avg) })}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </aside>
  );
}
