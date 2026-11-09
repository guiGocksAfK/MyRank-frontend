import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { useLanguage } from '../../shared/i18n';
import { socialApi } from './socialData';
import SocialAvatar from './SocialAvatar';

/** Pessoa numa linha: foto + nome (abre o perfil), o gosto parecido e a ação à direita. */
function Person({ u, onOpen, children }) {
  const { t } = useLanguage();
  return (
    <div className="social-person">
      <button type="button" className="social-person-main" onClick={() => onOpen?.(u.id)}>
        <SocialAvatar name={u.username} initials={u.initials} src={u.avatarSrc} size={32} />
        <span className="social-person-text">
          <span className="social-person-name">{u.username}</span>
          {u.matchPct != null && (
            <span className="social-person-meta">
              <b className="social-match">{t.social.people.match.replace('{pct}', u.matchPct)}</b>
            </span>
          )}
        </span>
      </button>
      {children}
    </div>
  );
}

/**
 * Trilho direito do Feed: "Você" (seguindo / seguidores), os pedidos pra te
 * seguir (só quando há) e sugestões pra seguir. Público/privado não mora mais
 * aqui: é ajuste, fica nas Configurações.
 */
export default function SocialRail({ onOpenConnections, onOpenUser, onGoPeople }) {
  const { t } = useLanguage();
  const tr = t.social.rail;
  const tp = t.social.people;
  const [summary, setSummary] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [requests, setRequests] = useState([]);

  const refreshSummary = () => socialApi.getSummary().then(setSummary).catch(() => {});

  useEffect(() => {
    socialApi.getSummary().then(setSummary).catch(() => setSummary({ following: 0, followers: 0 }));
    socialApi.getSuggestions().then((r) => setSuggestions(r.slice(0, 3))).catch(() => setSuggestions([]));
    socialApi.getFollowRequests().then(setRequests).catch(() => setRequests([]));
  }, []);

  const resolveRequest = async (id, accept) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    try {
      if (accept) await socialApi.approveFollowRequest(id);
      else await socialApi.rejectFollowRequest(id);
      refreshSummary();
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
      refreshSummary();
    } catch {
      /* silencioso */
    }
  };

  return (
    <aside className="social-rail">
      <section className="mr-panel social-rail-card is-you">
        <h2 className="social-rail-title">{tr.you}</h2>
        <div className="social-rail-stats">
          <button type="button" onClick={() => onOpenConnections('following')}>
            <b>{summary?.following ?? '—'}</b>
            <span>{tr.following}</span>
          </button>
          <button type="button" onClick={() => onOpenConnections('followers')}>
            <b>{summary?.followers ?? '—'}</b>
            <span>{tr.followers}</span>
          </button>
        </div>
      </section>

      {requests.length > 0 && (
        <section className="mr-panel social-rail-card">
          <h2 className="social-rail-title">{tr.requests} · {requests.length}</h2>
          <div className="social-rail-list">
            {requests.map((u) => (
              <Person key={u.id} u={u} onOpen={onOpenUser}>
                <span className="social-rail-request-actions">
                  <button type="button" className="social-icon-btn is-gold" aria-label={tr.accept} title={tr.accept}
                    onClick={() => resolveRequest(u.id, true)}>
                    <Check size={16} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                  <button type="button" className="social-icon-btn" aria-label={tr.decline} title={tr.decline}
                    onClick={() => resolveRequest(u.id, false)}>
                    <X size={16} strokeWidth={2} aria-hidden="true" />
                  </button>
                </span>
              </Person>
            ))}
          </div>
        </section>
      )}

      {/* no celular some: as sugestões já estão na aba Pessoas */}
      <section className="mr-panel social-rail-card is-suggest">
        <h2 className="social-rail-title">{tr.suggestions}</h2>
        {suggestions === null ? (
          <p className="social-rail-empty">{tr.loading}</p>
        ) : suggestions.length === 0 ? (
          <p className="social-rail-empty">{tr.noSuggestions}</p>
        ) : (
          <div className="social-rail-list">
            {suggestions.map((u) => (
              <Person key={u.id} u={u} onOpen={onOpenUser}>
                <button
                  type="button"
                  className={`social-chip-btn${u.requested ? '' : ' is-gold'}`}
                  onClick={() => followSuggestion(u.id)}
                >
                  {u.requested ? tp.requested : u.isPublic === false ? tp.request : tp.follow}
                </button>
              </Person>
            ))}
          </div>
        )}
        <button type="button" className="social-rail-more" onClick={onGoPeople}>{tr.seeAll}</button>
      </section>
    </aside>
  );
}
