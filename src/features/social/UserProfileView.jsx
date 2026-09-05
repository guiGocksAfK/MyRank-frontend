import { useEffect, useMemo, useState } from 'react';
import { useUnifiedItems } from '../../shared/useUnifiedItems';
import { useLanguage } from '../../shared/i18n';
import { useChat } from '../../shared/chat';
import { socialApi, computeTasteMatch, typeIconFor } from './socialData';
import SocialAvatar from './SocialAvatar';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

function MatchRing({ pct }) {
  const color = pct >= 75 ? 'var(--mr-gold)' : pct >= 50 ? '#f1c40f' : 'var(--mr-text-muted)';
  return (
    <div
      style={{
        width: 68,
        height: 68,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        background: `conic-gradient(${color} ${pct * 3.6}deg, var(--mr-border) 0)`,
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: '50%',
          background: 'var(--mr-surface)',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 800,
          fontSize: '0.95rem',
        }}
      >
        {pct}%
      </div>
    </div>
  );
}

export default function UserProfileView({ userId, onBack, onCompare, onToggleFollow }) {
  const { t } = useLanguage();
  const tv = t.social.profile;
  const { openChatWith } = useChat();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const { items: myItems, loading: loadingMine } = useUnifiedItems();

  useEffect(() => {
    setProfile(null);
    socialApi.getProfile(userId).then(setProfile).catch(() => setError(true));
  }, [userId]);

  const match = useMemo(
    () => (profile ? computeTasteMatch(myItems || [], profile.works) : null),
    [profile, myItems],
  );

  if (error) return <div className="social-empty">{tv.loadError}</div>;
  if (!profile) return <div className="social-empty">{tv.loading}</div>;

  // Perfil privado que você não segue: só cabeçalho + contagens (estilo Instagram).
  if (profile.locked) {
    return (
      <div className="mr-space-y-4">
        <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onBack}>{tv.back}</button>
        <div className="mr-card">
          <div className="mr-card-body" style={{ textAlign: 'center' }}>
            <div className="mr-flex mr-items-center mr-gap-4 mr-flex-wrap" style={{ justifyContent: 'center' }}>
              <SocialAvatar name={profile.username} initials={profile.initials} color={profile.color} src={profile.avatarSrc} size={64} />
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 10 }}>{profile.username}</div>
            <div className="social-muted" style={{ fontSize: '0.85rem' }}>@{profile.handle}</div>
            <div
              className="mr-flex mr-gap-4"
              style={{ justifyContent: 'center', margin: '14px 0', fontSize: '0.9rem' }}
            >
              <span><b>{profile.followerCount ?? 0}</b> <span className="social-muted">{tv.followersWord}</span></span>
              <span><b>{profile.followingCount ?? 0}</b> <span className="social-muted">{tv.followingWord}</span></span>
            </div>
            <div style={{ fontWeight: 700 }}>🔒 {tv.privateTitle}</div>
            <p className="social-muted" style={{ fontSize: '0.85rem', margin: '4px auto 14px', maxWidth: 320 }}>
              {tv.privateText}
            </p>
            <div className="mr-flex mr-gap-2" style={{ justifyContent: 'center' }}>
              <FollowButton profile={profile} onToggleFollow={onToggleFollow} tv={tv} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const breakdownRows = Object.entries(profile.breakdown).sort((a, b) => b[1] - a[1]);

  return (
    <div className="mr-space-y-4">
      <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onBack}>{tv.back}</button>

      {/* Cabeçalho */}
      <div className="mr-card">
        <div className="mr-card-body">
          <div className="mr-flex mr-items-center mr-gap-4 mr-flex-wrap">
            <SocialAvatar name={profile.username} initials={profile.initials} color={profile.color} src={profile.avatarSrc} size={64} />
            <div className="mr-min-w-0" style={{ flex: 1 }}>
              <div className="mr-flex mr-items-center mr-gap-2 mr-flex-wrap">
                <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>{profile.username}</span>
                {profile.followsYou && <span className="social-tag">{tv.followsYou}</span>}
              </div>
              <div className="social-muted" style={{ fontSize: '0.85rem' }}>@{profile.handle}</div>
              {profile.bio && <p style={{ fontSize: '0.85rem', marginTop: 6 }}>{profile.bio}</p>}
              <div className="social-muted" style={{ fontSize: '0.8rem', marginTop: 6 }}>
                {fmt(tv.stats, { works: profile.stats.works, avg: profile.stats.avgScore.toFixed(1) })}
              </div>
            </div>
            <div className="mr-flex mr-gap-2">
              <FollowButton profile={profile} onToggleFollow={onToggleFollow} tv={tv} />
              <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={() => onCompare(profile.id)}>
                {tv.compare}
              </button>
              <button
                className="mr-btn mr-btn-outline mr-btn-sm"
                onClick={() =>
                  openChatWith({
                    id: profile.id,
                    username: profile.username,
                    avatarUrl: profile.avatarUrl,
                  })
                }
              >
                {tv.message}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Afinidade de gosto */}
      <div className="mr-card">
        <div className="mr-card-body">
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>{tv.affinity}</h3>
          {loadingMine ? (
            <div className="social-muted">{tv.calculating}</div>
          ) : match.matchPct == null ? (
            <div className="social-muted" style={{ fontSize: '0.88rem' }}>
              {tv.noCommon}
            </div>
          ) : (
            <div className="mr-flex mr-items-center mr-gap-4 mr-flex-wrap">
              <MatchRing pct={match.matchPct} />
              <div className="mr-min-w-0" style={{ flex: 1, fontSize: '0.85rem' }}>
                <div style={{ marginBottom: 4 }}>
                  <strong>{match.sharedCount}</strong> {tv.sharedCount}
                </div>
                {match.agreements[0] && (
                  <div className="social-muted">
                    {tv.alignedIn} <strong>{match.agreements[0].title}</strong>
                  </div>
                )}
                {match.disagreements[0] && (
                  <div className="social-muted">
                    {tv.disagreeIn} <strong>{match.disagreements[0].title}</strong>{' '}
                    ({match.disagreements[0].mine.toFixed(1)} vs {match.disagreements[0].theirs.toFixed(1)})
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mr-profile-grid">
        {/* Top obras */}
        <div className="mr-card">
          <div className="mr-card-body">
            <h3 style={{ fontWeight: 700, marginBottom: 10 }}>{tv.topWorks}</h3>
            <div className="mr-space-y-2">
              {profile.top.slice(0, 10).map((w, i) => (
                <div key={w.title} className="mr-flex mr-items-center mr-gap-3" style={{ fontSize: '0.85rem' }}>
                  <span className="social-muted" style={{ width: 18, textAlign: 'right' }}>{i + 1}</span>
                  <span style={{ flexShrink: 0 }}>{typeIconFor(w.type)}</span>
                  <span className="mr-truncate" style={{ flex: 1 }}>{w.title}</span>
                  <strong style={{ color: 'var(--mr-gold)', fontVariantNumeric: 'tabular-nums' }}>
                    {w.score.toFixed(1)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Distribuição + badges */}
        <div className="mr-space-y-4">
          <div className="mr-card">
            <div className="mr-card-body">
              <h3 style={{ fontWeight: 700, marginBottom: 10 }}>{tv.distribution}</h3>
              <div className="mr-space-y-2">
                {breakdownRows.map(([type, n]) => (
                  <div key={type} className="mr-flex mr-items-center mr-justify-between" style={{ fontSize: '0.85rem' }}>
                    <span>{typeIconFor(type)} {t.common.mediaTypes[type] || type}</span>
                    <span className="social-muted">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mr-card">
            <div className="mr-card-body">
              <h3 style={{ fontWeight: 700, marginBottom: 10 }}>{tv.achievements}</h3>
              <div className="mr-flex mr-flex-wrap mr-gap-2">
                {profile.badges.map((b) => (
                  <span key={b.name} title={b.name} className="social-tag" style={{ fontSize: '0.8rem' }}>
                    {b.icon} {b.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Botão seguir com 3 estados: Seguindo · Solicitado · Seguir. */
function FollowButton({ profile, onToggleFollow, tv }) {
  const [following, setFollowing] = useState(profile.following);
  const [requested, setRequested] = useState(profile.requested);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    if (following) setFollowing(false);
    else if (requested) setRequested(false);
    else if (profile.isPublic === false) setRequested(true);
    else setFollowing(true);
    try {
      const updated = await onToggleFollow(profile.id);
      if (updated) {
        setFollowing(updated.following);
        setRequested(updated.requested);
      }
    } catch {
      setFollowing(profile.following);
      setRequested(profile.requested);
    } finally {
      setBusy(false);
    }
  }

  const label = following
    ? tv.following
    : requested
      ? tv.requested
      : profile.isPublic === false
        ? tv.request
        : tv.follow;
  return (
    <button
      className={`mr-btn mr-btn-sm ${following || requested ? 'mr-btn-outline' : 'mr-btn-gold'}`}
      onClick={toggle}
      disabled={busy}
    >
      {label}
    </button>
  );
}
