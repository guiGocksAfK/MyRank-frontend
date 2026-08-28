import { useState } from 'react';
import SocialAvatar from './SocialAvatar';

/** Linha de usuário reutilizável: avatar + nome/handle + stats + botão seguir. */
export default function UserPill({ user, onToggleFollow, onOpen }) {
  const [following, setFollowing] = useState(user.following);
  const [busy, setBusy] = useState(false);

  async function toggle(e) {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    setFollowing((v) => !v); // otimista
    try {
      const updated = await onToggleFollow(user.id);
      if (updated) setFollowing(updated.following);
    } catch {
      setFollowing(user.following);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="social-userpill" onClick={() => onOpen?.(user.id)} role="button" tabIndex={0}>
      <SocialAvatar name={user.username} initials={user.initials} color={user.color} size={40} />
      <div className="mr-min-w-0" style={{ flex: 1 }}>
        <div className="mr-flex mr-items-center mr-gap-2" style={{ flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }} className="mr-truncate">{user.username}</span>
          {user.followsYou && <span className="social-tag">segue você</span>}
        </div>
        <div className="social-muted" style={{ fontSize: '0.8rem' }}>
          @{user.handle} · {user.stats.works} obras · média {user.stats.avgScore.toFixed(1)}
        </div>
      </div>
      <button
        className={`mr-btn mr-btn-sm ${following ? 'mr-btn-outline' : 'mr-btn-gold'}`}
        onClick={toggle}
        disabled={busy}
      >
        {following ? 'Seguindo' : 'Seguir'}
      </button>
    </div>
  );
}
