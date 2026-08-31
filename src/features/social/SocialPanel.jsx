import { useEffect, useRef, useState } from 'react';
import './social.css';
import { useLanguage } from '../../shared/i18n';
import { useChat } from '../../shared/chat';
import { socialApi } from './socialData';
import SocialFeed from './SocialFeed';
import SocialRail from './SocialRail';
import ConnectionsView from './ConnectionsView';
import SocialEmpty from './SocialEmpty';
import Discover from './Discover';
import GroupDiscover from './GroupDiscover';
import UserProfileView from './UserProfileView';
import CompareView from './CompareView';
import SocialAvatar from './SocialAvatar';
import ChatPanel from '../chat/ChatPanel';

const fmtStr = (str, v = {}) => String(str).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

function CompareList({ onPick }) {
  const { t } = useLanguage();
  const tcl = t.social.compareList;
  const [following, setFollowing] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    socialApi.getFollowing().then(setFollowing).catch(() => setFollowing([]));
  }, []);

  if (following === null) return <SocialEmpty icon="⏳" text={t.social.loading} />;
  if (following.length === 0) {
    return (
      <SocialEmpty
        icon="⚖️"
        text={`${tcl.empty1} ${tcl.discoverWord} ${tcl.empty2}`}
      />
    );
  }

  const term = q.trim().toLowerCase();
  const list = term
    ? following.filter(
        (u) =>
          u.username.toLowerCase().includes(term) ||
          (u.handle || '').toLowerCase().includes(term),
      )
    : following;

  return (
    <section className="social-disc-card">
      <div className="social-disc-head">
        <div className="social-disc-title"><span aria-hidden="true">⚖️</span> {tcl.title}</div>
      </div>
      <p className="social-compare-sub">{tcl.subtitle}</p>

      <div className="social-disc-searchwrap">
        <span aria-hidden="true">🔍</span>
        <input
          className="social-disc-search"
          value={q}
          placeholder={tcl.search}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="social-disc-body">
        {list.length === 0 ? (
          <SocialEmpty icon="🔍" text={tcl.noMatch} />
        ) : (
          <ul className="social-compare-list">
            {list.map((u) => (
              <li key={u.id}>
                <button type="button" className="social-compare-row" onClick={() => onPick(u.id)}>
                  <SocialAvatar
                    name={u.username}
                    initials={u.initials}
                    color={u.color}
                    src={u.avatarSrc}
                    size={40}
                  />
                  <span className="social-compare-info">
                    <span className="social-compare-name">{u.username}</span>
                    <span className="social-compare-meta">
                      {fmtStr(t.social.pill.stats, {
                        handle: u.handle,
                        works: u.stats.works,
                        avg: u.stats.avgScore.toFixed(1),
                      })}
                    </span>
                  </span>
                  <span className="social-compare-cta">{tcl.pick} →</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function SocialPanel({ initialConvId = null, onInitialConvConsumed, onNavigate }) {
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
  const [pendingConvId, setPendingConvId] = useState(null); // grupo aberto a partir do "Descobrir"

  const openGroupConversation = (id) => {
    setPendingConvId(id);
    setView({ kind: 'tabs' });
    setTab('chat');
  };

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
  const openConnections = (which) => setView({ kind: 'connections', tab: which });
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

  // ── Sub-view: seguindo / seguidores ──
  if (view.kind === 'connections') {
    return (
      <div className="mr-space-y-6 social-panel">
        <ConnectionsView initialTab={view.tab} onBack={backToTabs} onOpenUser={openProfile} />
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

      {tab === 'feed' && (
        <div className="social-feed-layout">
          <SocialFeed
            onOpenUser={openProfile}
            onNavigate={onNavigate}
            onGoDiscover={() => setTab('discover')}
          />
          <SocialRail
            onOpenConnections={openConnections}
            onOpenUser={openProfile}
            onGoDiscover={() => setTab('discover')}
          />
        </div>
      )}
      {tab === 'discover' && (
        <div className="social-discover-layout">
          <Discover onOpenUser={openProfile} />
          <GroupDiscover onOpenConversation={openGroupConversation} />
        </div>
      )}
      {tab === 'compare' && <CompareList onPick={openCompare} />}
      {tab === 'chat' && (
        <ChatPanel
          initialConvId={initialConvId ?? pendingConvId}
          onInitialConvConsumed={() => {
            setPendingConvId(null);
            onInitialConvConsumed?.();
          }}
          onOpenProfile={openProfile}
        />
      )}
    </div>
  );
}
