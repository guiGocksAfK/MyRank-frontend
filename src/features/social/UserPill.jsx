import { useState } from 'react';
import SocialAvatar from './SocialAvatar';
import { useLanguage } from '../../shared/i18n';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

/** Linha de usuário reutilizável: avatar + nome/handle + stats + botão seguir. */
export default function UserPill({ user, onToggleFollow, onOpen }) {
  const { t } = useLanguage();
  const tp = t.social.pill;
  const [following, setFollowing] = useState(user.following);
  const [requested, setRequested] = useState(user.requested);
  const [busy, setBusy] = useState(false);

  async function toggle(e) {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    // otimista
    if (following) setFollowing(false);
    else if (requested) setRequested(false);
    else if (user.isPublic === false) setRequested(true);
    else setFollowing(true);
    try {
      const updated = await onToggleFollow(user.id);
      if (updated) {
        setFollowing(updated.following);
        setRequested(updated.requested);
      }
    } catch {
      setFollowing(user.following);
      setRequested(user.requested);
    } finally {
      setBusy(false);
    }
  }

  const label = following
    ? tp.following
    : requested
      ? tp.requested
      : user.isPublic === false
        ? tp.request
        : tp.follow;
  const outline = following || requested;

  return (
    <div className="social-userpill" onClick={() => onOpen?.(user.id)} role="button" tabIndex={0}>
      <SocialAvatar name={user.username} initials={user.initials} color={user.color} src={user.avatarSrc} size={40} />
      <div className="mr-min-w-0" style={{ flex: 1 }}>
        <div className="mr-flex mr-items-center mr-gap-2" style={{ flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }} className="mr-truncate">{user.username}</span>
          {user.followsYou && <span className="social-tag">{tp.followsYou}</span>}
        </div>
        <div className="social-muted" style={{ fontSize: '0.8rem' }}>
          {fmt(tp.stats, { handle: user.handle, works: user.stats.works, avg: user.stats.avgScore.toFixed(1) })}
        </div>
      </div>
      <button
        className={`mr-btn mr-btn-sm ${outline ? 'mr-btn-outline' : 'mr-btn-gold'}`}
        onClick={toggle}
        disabled={busy}
      >
        {label}
      </button>
    </div>
  );
}
