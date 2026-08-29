import { useEffect, useMemo, useState } from 'react';
import { useUnifiedItems } from '../../shared/useUnifiedItems';
import { useLanguage } from '../../shared/i18n';
import { socialApi, computeTasteMatch, typeIconFor } from './socialData';
import SocialAvatar from './SocialAvatar';

const norm = (t) => (t || '').trim().toLowerCase();

function ScoreCell({ value, color }) {
  if (value == null) return <span className="social-muted">—</span>;
  return (
    <span style={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
      {Number(value).toFixed(1)}
    </span>
  );
}

export default function CompareView({ userId, onBack, onOpenUser }) {
  const { t } = useLanguage();
  const tc = t.social.compare;
  const [friend, setFriend] = useState(null);
  const { items: myItems, loading } = useUnifiedItems();

  useEffect(() => {
    socialApi.getProfile(userId).then(setFriend).catch(() => setFriend(false));
  }, [userId]);

  const rows = useMemo(() => {
    if (!friend || !myItems) return [];
    const mineMap = new Map(myItems.map((i) => [norm(i.title), Number(i.note)]));
    const theirMap = new Map(friend.works.map((w) => [norm(w.title), w]));
    const titles = new Set([...mineMap.keys(), ...theirMap.keys()]);
    return [...titles]
      .map((key) => {
        const theirs = theirMap.get(key);
        const mine = mineMap.get(key);
        const label =
          theirs?.title ||
          myItems.find((i) => norm(i.title) === key)?.title ||
          key;
        const type = theirs?.type || myItems.find((i) => norm(i.title) === key)?.type || 'outro';
        return {
          key,
          label,
          type,
          mine: mine ?? null,
          theirs: theirs ? theirs.score : null,
          diff: mine != null && theirs ? +(mine - theirs.score).toFixed(1) : null,
        };
      })
      .sort((a, b) => {
        const shared = (r) => (r.mine != null && r.theirs != null ? 0 : 1);
        return shared(a) - shared(b) || (b.theirs ?? b.mine ?? 0) - (a.theirs ?? a.mine ?? 0);
      });
  }, [friend, myItems]);

  const match = useMemo(
    () => (friend && myItems ? computeTasteMatch(myItems, friend.works) : null),
    [friend, myItems],
  );

  if (friend === false) return <div className="social-empty">{tc.notFound}</div>;
  if (!friend || loading) return <div className="social-empty">{tc.loading}</div>;

  const firstName = friend.username.split(' ')[0];

  return (
    <div className="mr-space-y-4">
      <div className="mr-flex mr-items-center mr-gap-3 mr-flex-wrap">
        <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onBack}>{tc.back}</button>
        <span style={{ fontWeight: 700 }}>{tc.you}</span>
        <span className="social-muted">{tc.vs}</span>
        <button className="social-link" onClick={() => onOpenUser?.(friend.id)}>
          <SocialAvatar name={friend.username} initials={friend.initials} color={friend.color} src={friend.avatarSrc} size={22} />
          <span style={{ marginLeft: 6, fontWeight: 700 }}>{firstName}</span>
        </button>
      </div>

      {/* Resumo */}
      <div className="mr-stats-grid">
        <div className="mr-stat-card">
          <div className="mr-stat-value">{match.sharedCount}</div>
          <div className="mr-stat-label">{tc.sharedWorks}</div>
        </div>
        <div className="mr-stat-card">
          <div className="mr-stat-value">{match.matchPct == null ? '—' : `${match.matchPct}%`}</div>
          <div className="mr-stat-label">{tc.affinity}</div>
        </div>
        <div className="mr-stat-card">
          <div className="mr-stat-value">{match.favorites.length}</div>
          <div className="mr-stat-label">{tc.sharedFavs}</div>
        </div>
        <div className="mr-stat-card">
          <div className="mr-stat-value">
            {match.disagreements[0] ? Math.abs(match.disagreements[0].diff).toFixed(1) : '—'}
          </div>
          <div className="mr-stat-label">{tc.biggestGap}</div>
        </div>
      </div>

      {/* Tabela lado a lado */}
      <div className="mr-card">
        <div className="mr-card-body mr-space-y-2">
          <div className="mr-table-header" style={{ gridTemplateColumns: '1fr 70px 70px 56px' }}>
            <span>{tc.colWork}</span>
            <span style={{ textAlign: 'right' }}>{tc.you}</span>
            <span style={{ textAlign: 'right' }}>{firstName}</span>
            <span style={{ textAlign: 'center' }}>Δ</span>
          </div>
          {rows.length === 0 && <div className="social-empty">{tc.noData}</div>}
          {rows.map((r) => (
            <div key={r.key} className="mr-table-row" style={{ gridTemplateColumns: '1fr 70px 70px 56px' }}>
              <div className="mr-min-w-0 mr-flex mr-items-center mr-gap-2">
                <span style={{ flexShrink: 0 }}>{typeIconFor(r.type)}</span>
                <span className="mr-truncate">{r.label}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <ScoreCell value={r.mine} color="var(--mr-gold)" />
              </div>
              <div style={{ textAlign: 'right' }}>
                <ScoreCell value={r.theirs} color={friend.color} />
              </div>
              <div style={{ textAlign: 'center' }}>
                {r.diff == null ? (
                  <span className="social-muted">—</span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: r.diff === 0 ? 'var(--mr-text-secondary)' : r.diff > 0 ? 'var(--mr-gold)' : '#e24b4a',
                    }}
                  >
                    {r.diff > 0 ? '+' : ''}{r.diff}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
