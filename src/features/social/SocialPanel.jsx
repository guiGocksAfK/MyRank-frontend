import { useEffect, useRef, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import './social.css';
import '../rankings/rankings/rankings.css';
import { useLanguage } from '../../shared/i18n';
import { useChat } from '../../shared/chat';
import { socialApi, socialMock } from './socialData';
import SocialFeed from './SocialFeed';
import SocialRail from './SocialRail';
import ConnectionsView from './ConnectionsView';
import People from './People';
import UserProfileView from './UserProfileView';
import CompareView from './CompareView';
import ChatPanel from '../chat/ChatPanel';

/**
 * Aba Social: Feed | Pessoas | Mensagens. "Pessoas" juntou o antigo Descobrir
 * com o Comparar (o Comparar virou botão em cada pessoa que você segue).
 * Perfil de alguém, comparação e seguindo/seguidores abrem por cima das abas.
 */
export default function SocialPanel({ initialConvId = null, onInitialConvConsumed, onNavigate }) {
  const { t } = useLanguage();
  const ts = t.social;
  const { unreadCount: chatUnread, openNonce } = useChat();
  const TABS = [
    { id: 'feed', label: ts.tabs.feed },
    { id: 'people', label: ts.tabs.people },
    { id: 'chat', label: ts.tabs.chat },
  ];
  const [tab, setTab] = useState('feed');
  const [view, setView] = useState({ kind: 'tabs' }); // tabs | profile | compare | connections
  const [pendingConvId, setPendingConvId] = useState(null); // grupo aberto a partir do "Pessoas"
  const [feedItems, setFeedItems] = useState(null); // o que o feed carregou, pro "Em alta" do trilho
  // só no dev: liga/desliga os dados de teste; mudar a chave remonta tudo com os dados novos
  const [mockOn, setMockOn] = useState(() => socialMock.isOn());

  const toggleMock = () => {
    socialMock.set(!mockOn);
    setMockOn(!mockOn);
  };

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

  let content;
  if (view.kind === 'profile') {
    content = (
      <UserProfileView userId={view.userId} onBack={backToTabs} onCompare={openCompare} onToggleFollow={toggleFollow} />
    );
  } else if (view.kind === 'compare') {
    content = <CompareView userId={view.userId} onBack={backToTabs} onOpenUser={openProfile} />;
  } else if (view.kind === 'connections') {
    content = <ConnectionsView initialTab={view.tab} onBack={backToTabs} onOpenUser={openProfile} onCompare={openCompare} />;
  } else {
    content = (
      <>
        <div className="social-tabbar">
          <div className="rk-tabs" role="tablist" aria-label={ts.tabsLabel}>
            <div className="rk-tabs-scroll">
              {TABS.map((tb) => (
                <button
                  key={tb.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === tb.id}
                  className={`rk-tab${tab === tb.id ? ' is-active' : ''}`}
                  onClick={() => setTab(tb.id)}
                >
                  {tb.label}
                  {tb.id === 'chat' && chatUnread > 0 && (
                    <span className="social-tab-badge">{chatUnread > 9 ? '9+' : chatUnread}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {socialMock.available && (
            <button type="button" className={`social-devtoggle${mockOn ? ' is-on' : ''}`} aria-pressed={mockOn} aria-label={ts.devData}
              title={ts.devDataHint} onClick={toggleMock}>
              <FlaskConical size={14} strokeWidth={1.8} aria-hidden="true" />
              <span className="social-devtoggle-text">{ts.devData}</span>
            </button>
          )}
        </div>

        {tab === 'feed' && (
          <div className="social-feed-layout">
            <SocialFeed onOpenUser={openProfile} onNavigate={onNavigate} onGoPeople={() => setTab('people')} onItems={setFeedItems} />
            <SocialRail feedItems={feedItems} onOpenConnections={openConnections} onOpenUser={openProfile} onGoPeople={() => setTab('people')} />
          </div>
        )}
        {tab === 'people' && (
          <People onOpenUser={openProfile} onCompare={openCompare} onOpenConversation={openGroupConversation} />
        )}
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
      </>
    );
  }

  // key: trocar os dados de teste remonta tudo e busca de novo
  return (
    <div key={mockOn ? 'mock' : 'real'} className="rk-page social-panel">
      {content}
    </div>
  );
}
