import { useEffect, useMemo, useState } from 'react';
import { useUnifiedItems } from '../../shared/useUnifiedItems';
import { socialApi, computeTasteMatch, typeIconFor } from './socialData';
import SocialAvatar from './SocialAvatar';

const BUCKET_LABEL = { jogo: 'Jogos', filme: 'Filmes', serie: 'Séries', livro: 'Livros', anime: 'Animes', outro: 'Outros' };

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

  if (error) return <div className="social-empty">Não foi possível carregar esse perfil.</div>;
  if (!profile) return <div className="social-empty">Carregando perfil…</div>;

  const breakdownRows = Object.entries(profile.breakdown).sort((a, b) => b[1] - a[1]);

  return (
    <div className="mr-space-y-4">
      <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onBack}>← Voltar</button>

      {/* Cabeçalho */}
      <div className="mr-card">
        <div className="mr-card-body">
          <div className="mr-flex mr-items-center mr-gap-4 mr-flex-wrap">
            <SocialAvatar name={profile.username} initials={profile.initials} color={profile.color} size={64} />
            <div className="mr-min-w-0" style={{ flex: 1 }}>
              <div className="mr-flex mr-items-center mr-gap-2 mr-flex-wrap">
                <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>{profile.username}</span>
                {profile.plan === 'PRO' && <span className="mr-badge mr-badge-gold" style={{ fontSize: '0.65rem' }}>PRO</span>}
                {profile.followsYou && <span className="social-tag">segue você</span>}
              </div>
              <div className="social-muted" style={{ fontSize: '0.85rem' }}>@{profile.handle}</div>
              {profile.bio && <p style={{ fontSize: '0.85rem', marginTop: 6 }}>{profile.bio}</p>}
              <div className="social-muted" style={{ fontSize: '0.8rem', marginTop: 6 }}>
                {profile.stats.works} obras · média {profile.stats.avgScore.toFixed(1)}
              </div>
            </div>
            <div className="mr-flex mr-gap-2">
              <button
                className={`mr-btn mr-btn-sm ${profile.following ? 'mr-btn-outline' : 'mr-btn-gold'}`}
                onClick={() => onToggleFollow(profile.id)}
              >
                {profile.following ? 'Seguindo' : 'Seguir'}
              </button>
              <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={() => onCompare(profile.id)}>
                ⚖️ Comparar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Afinidade de gosto */}
      <div className="mr-card">
        <div className="mr-card-body">
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🎯 Afinidade de gosto</h3>
          {loadingMine ? (
            <div className="social-muted">Calculando…</div>
          ) : match.matchPct == null ? (
            <div className="social-muted" style={{ fontSize: '0.88rem' }}>
              Vocês não têm obras avaliadas em comum ainda.
            </div>
          ) : (
            <div className="mr-flex mr-items-center mr-gap-4 mr-flex-wrap">
              <MatchRing pct={match.matchPct} />
              <div className="mr-min-w-0" style={{ flex: 1, fontSize: '0.85rem' }}>
                <div style={{ marginBottom: 4 }}>
                  <strong>{match.sharedCount}</strong> obras em comum
                </div>
                {match.agreements[0] && (
                  <div className="social-muted">
                    Mais alinhados em <strong>{match.agreements[0].title}</strong>
                  </div>
                )}
                {match.disagreements[0] && (
                  <div className="social-muted">
                    Discordam mais em <strong>{match.disagreements[0].title}</strong>{' '}
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
            <h3 style={{ fontWeight: 700, marginBottom: 10 }}>🏆 Top obras</h3>
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
              <h3 style={{ fontWeight: 700, marginBottom: 10 }}>📊 Distribuição</h3>
              <div className="mr-space-y-2">
                {breakdownRows.map(([type, n]) => (
                  <div key={type} className="mr-flex mr-items-center mr-justify-between" style={{ fontSize: '0.85rem' }}>
                    <span>{typeIconFor(type)} {BUCKET_LABEL[type] || type}</span>
                    <span className="social-muted">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mr-card">
            <div className="mr-card-body">
              <h3 style={{ fontWeight: 700, marginBottom: 10 }}>🏅 Conquistas</h3>
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
