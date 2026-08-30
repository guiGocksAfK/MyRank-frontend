import { useCallback, useEffect, useRef, useState } from 'react';
import './social.css';
import { useLanguage } from '../../shared/i18n';
import { useChat } from '../../shared/chat';
import { socialApi } from './socialData';
import SocialFeed from './SocialFeed';
import Discover from './Discover';
import UserProfileView from './UserProfileView';
import CompareView from './CompareView';
import UserPill from './UserPill';
import ChatPanel from '../chat/ChatPanel';

function CompareList({ onPick, onFollowChange }) {
  const { t } = useLanguage();
  const ts = t.social;
  const [following, setFollowing] = useState(null);

  const load = useCallback(() => {
    socialApi.getFollowing().then(setFollowing);
  }, []);
  useEffect(load, [load]);

  if (following === null) return <div className="social-empty">{ts.loading}</div>;
  if (following.length === 0) {
    return (
      <div className="social-empty">
        {ts.compareList.empty1} <strong>{ts.compareList.discoverWord}</strong> {ts.compareList.empty2}
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
        {ts.compareList.hint}
      </div>
      {following.map((u) => (
        <UserPill key={u.id} user={u} onToggleFollow={handleFollow} onOpen={onPick} />
      ))}
    </div>
  );
}

export default function SocialPanel({ initialConvId = null, onInitialConvConsumed }) {
  const { t } = useLanguage();
  const ts = t.social;
  const { unreadCount: chatUnread, openNonce } = useChat();
  const TABS = [
    { id: 'feed', label: ts.tabs.feed },
    { id: 'discover', label: ts.tabs.discover },
    { id: 'compare', label: ts.tabs.compare },
    { id: 'chat', label: ts.tabs.chat },
  ];
  const [tab, setTab] = useState('feed');
  const [view, setView] = useState({ kind: 'tabs' }); // tabs | profile | compare

  // Pedido externo de abrir uma conversa (botão "Mensagem" no perfil de alguém).
  const openNonceSeen = useRef(openNonce);
  useEffect(() => {
    if (openNonce !== openNonceSeen.current) {
      openNonceSeen.current = openNonce;
      setView({ kind: 'tabs' });
      setTab('chat');
    }
  }, [openNonce]);

  // Veio de /chat/invite/:token — abre direto a sub-aba Mensagens na conversa aceita.
  useEffect(() => {
    if (initialConvId == null) return;
    setView({ kind: 'tabs' });
    setTab('chat');
  }, [initialConvId]);

  const openProfile = (userId) => setView({ kind: 'profile', userId });
  const openCompare = (userId) => setView({ kind: 'compare', userId });
  const backToTabs = () => setView({ kind: 'tabs' });

  const toggleFollow = async (userId) => socialApi.toggleFollow(userId);

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
  return (
    <div className="mr-space-y-5 social-panel">
      {/* Sub-abas */}
      <div className="mr-flex mr-items-center mr-gap-1 social-tabs">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            className={`mr-tab-trigger social-tab-trigger ${tab === tb.id ? 'active' : ''}`}
            onClick={() => setTab(tb.id)}
          >
            {tb.label}
            {tb.id === 'chat' && chatUnread > 0 && (
              <span className="social-tab-badge">{chatUnread > 9 ? '9+' : chatUnread}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'feed' && <SocialFeed onOpenUser={openProfile} />}
      {tab === 'discover' && <Discover onOpenUser={openProfile} />}
      {tab === 'compare' && <CompareList onPick={openCompare} />}
      {tab === 'chat' && (
        <ChatPanel
          initialConvId={initialConvId}
          onInitialConvConsumed={onInitialConvConsumed}
          onOpenProfile={openProfile}
        />
      )}
    </div>
  );
}
