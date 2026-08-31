import { useEffect, useState } from 'react';
import { useLanguage } from '../../shared/i18n';
import { useUser } from '../../shared/userContext';
import { updateMe } from '../../services/userService';
import { socialApi } from './socialData';
import SocialAvatar from './SocialAvatar';

/**
 * Trilho direito da aba Feed: card "Você" (contadores + público/privado)
 * e "Sugestões pra seguir". Some no mobile (as sugestões vivem na aba Descobrir).
 */
export default function SocialRail({ onOpenConnections, onOpenUser, onGoDiscover }) {
  const { t } = useLanguage();
  const tr = t.social.rail;
  const { user, setUser } = useUser();
  const [summary, setSummary] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [recentFollowers, setRecentFollowers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [toggling, setToggling] = useState(false);

  const isPublic = user?.isPublic ?? true;

  useEffect(() => {
    socialApi.getSummary().then(setSummary).catch(() => setSummary({ following: 0, followers: 0 }));
    socialApi.getSuggestions().then((r) => setSuggestions(r.slice(0, 4))).catch(() => setSuggestions([]));
    socialApi.getRecentFollowers(4).then(setRecentFollowers).catch(() => setRecentFollowers([]));
    socialApi.getFollowRequests().then(setRequests).catch(() => setRequests([]));
  }, []);

  const resolveRequest = async (id, accept) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    try {
      if (accept) await socialApi.approveFollowRequest(id);
      else await socialApi.rejectFollowRequest(id);
      socialApi.getSummary().then(setSummary).catch(() => {});
    } catch {
      socialApi.getFollowRequests().then(setRequests).catch(() => {});
    }
  };

  const togglePublic = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const updated = await updateMe({ isPublic: !isPublic });
      setUser(updated);
    } catch {
      /* silencioso */
    } finally {
      setToggling(false);
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
      socialApi.getSummary().then(setSummary).catch(() => {});
    } catch {
      /* silencioso */
    }
  };

  return (
    <aside className="social-rail">
      {/* Card "Você" */}
      <div className="social-rail-card">
        <div className="social-rail-title">{tr.you}</div>
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
        <button
          type="button"
          className={`social-visibility ${isPublic ? 'is-public' : ''}`}
          onClick={togglePublic}
          disabled={toggling}
          title={tr.toggleHint}
        >
          {isPublic ? tr.public : tr.private}
        </button>
      </div>

      {/* Solicitações pra te seguir (só aparece se houver) */}
      {requests.length > 0 && (
        <div className="social-rail-card">
          <div className="social-rail-title">{tr.requests}</div>
          <div className="social-rail-list">
            {requests.map((u) => (
              <div key={u.id} className="social-rail-request">
                <button
                  type="button"
                  className="social-rail-user-main"
                  onClick={() => onOpenUser?.(u.id)}
                >
                  <SocialAvatar
                    name={u.username}
                    initials={u.initials}
                    color={u.color}
                    src={u.avatarSrc}
                    size={34}
                  />
                  <span className="social-rail-user-name">{u.username}</span>
                </button>
                <div className="social-rail-request-actions">
                  <button
                    type="button"
                    className="mr-btn mr-btn-gold mr-btn-sm"
                    onClick={() => resolveRequest(u.id, true)}
                  >
                    {tr.accept}
                  </button>
                  <button
                    type="button"
                    className="mr-btn mr-btn-outline mr-btn-sm"
                    onClick={() => resolveRequest(u.id, false)}
                  >
                    {tr.decline}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quem te seguiu (só aparece se houver) */}
      {recentFollowers.length > 0 && (
        <div className="social-rail-card">
          <div className="social-rail-title">{tr.newFollowers}</div>
          <div className="social-rail-list">
            {recentFollowers.map((u) => (
              <button
                key={u.id}
                type="button"
                className="social-rail-user-main"
                onClick={() => onOpenUser?.(u.id)}
                style={{ padding: '6px 0' }}
              >
                <SocialAvatar
                  name={u.username}
                  initials={u.initials}
                  color={u.color}
                  src={u.avatarSrc}
                  size={34}
                />
                <span className="social-rail-user-name">{u.username}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sugestões pra seguir */}
      <div className="social-rail-card">
        <div className="social-rail-title">{tr.suggestions}</div>
        {suggestions === null ? (
          <div className="social-rail-empty">{tr.loading}</div>
        ) : suggestions.length === 0 ? (
          <div className="social-rail-empty">{tr.noSuggestions}</div>
        ) : (
          <div className="social-rail-list">
            {suggestions.map((u) => (
              <div key={u.id} className="social-rail-user">
                <button
                  type="button"
                  className="social-rail-user-main"
                  onClick={() => onOpenUser?.(u.id)}
                >
                  <SocialAvatar
                    name={u.username}
                    initials={u.initials}
                    color={u.color}
                    src={u.avatarSrc}
                    size={34}
                  />
                  <span className="social-rail-user-name">{u.username}</span>
                </button>
                <button
                  type="button"
                  className={`mr-btn mr-btn-sm ${u.requested ? 'mr-btn-outline' : 'mr-btn-gold'}`}
                  onClick={() => followSuggestion(u.id)}
                >
                  {u.requested ? t.social.pill.requested : tr.follow}
                </button>
              </div>
            ))}
          </div>
        )}
        <button type="button" className="social-rail-more" onClick={onGoDiscover}>
          {tr.seeAll} →
        </button>
      </div>
    </aside>
  );
}
