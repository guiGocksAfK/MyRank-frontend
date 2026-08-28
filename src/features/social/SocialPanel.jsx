import { useCallback, useEffect, useState } from 'react';
import './social.css';
import { useUser } from '../../shared/userContext';
import Avatar from '../../shared/components/Avatar';
import { socialApi } from './socialData';
import SocialFeed from './SocialFeed';
import Discover from './Discover';
import UserProfileView from './UserProfileView';
import CompareView from './CompareView';
import UserPill from './UserPill';

const TABS = [
  { id: 'feed', label: '📡 Feed' },
  { id: 'discover', label: '🔍 Descobrir' },
  { id: 'compare', label: '⚖️ Comparar' },
];

function CompareList({ onPick, onFollowChange }) {
  const [following, setFollowing] = useState(null);

  const load = useCallback(() => {
    socialApi.getFollowing().then(setFollowing);
  }, []);
  useEffect(load, [load]);

  if (following === null) return <div className="social-empty">Carregando…</div>;
  if (following.length === 0) {
    return (
      <div className="social-empty">
        Você não segue ninguém ainda. Vá em <strong>Descobrir</strong> pra começar.
      </div>
    );
  }

  const handleFollow = async (id) => {
    const r = await socialApi.toggleFollow(id);
    load();
    onFollowChange?.();
    return r;
  };

  return (
    <div className="mr-space-y-2">
      <div className="social-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
        Toque num usuário pra ver os rankings lado a lado
      </div>
      {following.map((u) => (
        <UserPill key={u.id} user={u} onToggleFollow={handleFollow} onOpen={onPick} />
      ))}
    </div>
  );
}

export default function SocialPanel() {
  const { user } = useUser();
  const [tab, setTab] = useState('feed');
  const [view, setView] = useState({ kind: 'tabs' }); // tabs | profile | compare
  const [isPublic, setIsPublic] = useState(user?.isPublic ?? true);
  const [summary, setSummary] = useState(null);

  const loadSummary = useCallback(() => {
    socialApi.getSummary().then(setSummary);
  }, []);
  useEffect(loadSummary, [loadSummary]);

  const openProfile = (userId) => setView({ kind: 'profile', userId });
  const openCompare = (userId) => setView({ kind: 'compare', userId });
  const backToTabs = () => setView({ kind: 'tabs' });

  const toggleFollow = async (userId) => {
    const updated = await socialApi.toggleFollow(userId);
    loadSummary();
    return updated;
  };

  // ── Sub-view: perfil de um usuário ──
  if (view.kind === 'profile') {
    return (
      <div className="mr-space-y-6 social-panel">
        <UserProfileView
          userId={view.userId}
          onBack={backToTabs}
          onCompare={openCompare}
          onToggleFollow={toggleFollow}
        />
      </div>
    );
  }

  // ── Sub-view: comparação ──
  if (view.kind === 'compare') {
    return (
      <div className="mr-space-y-6 social-panel">
        <CompareView userId={view.userId} onBack={backToTabs} onOpenUser={openProfile} />
      </div>
    );
  }

  // ── View principal ──
  const handle = user?.username ? `@${user.username}` : '@você';

  return (
    <div className="mr-space-y-5 social-panel">
      {/* Barra de identidade */}
      <div className="social-idbar">
        <Avatar user={user} cacheKey={user?._v} className="social-idbar-avatar" />

        <div className="social-idbar-main">
          <div className="social-idbar-handle">{handle}</div>
          <div className="social-idbar-stats">
            <button type="button" onClick={() => setTab('compare')}>
              <b>{summary?.following ?? '—'}</b> seguindo
            </button>
            <span className="social-idbar-sep" />
            <span><b>{summary?.followers ?? '—'}</b> seguidores</span>
            <span className="social-idbar-sep" />
            <button type="button" onClick={() => setTab('feed')}>
              <b>{summary?.recentActivity ?? '—'}</b> no feed
            </button>
          </div>
        </div>

        <button
          className={`social-visibility ${isPublic ? 'is-public' : ''}`}
          onClick={() => setIsPublic((v) => !v)}
          title="Alternar visibilidade do perfil (visual por enquanto)"
        >
          <span aria-hidden="true">{isPublic ? '🌐' : '🔒'}</span>
          Perfil {isPublic ? 'público' : 'privado'}
        </button>
      </div>

      {/* Sub-abas */}
      <div className="mr-flex mr-items-center mr-gap-1 social-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`mr-tab-trigger social-tab-trigger ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'feed' && <SocialFeed onOpenUser={openProfile} />}
      {tab === 'discover' && <Discover onOpenUser={openProfile} onFollowChange={loadSummary} />}
      {tab === 'compare' && <CompareList onPick={openCompare} onFollowChange={loadSummary} />}
    </div>
  );
}
