import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Search, SquarePen, Users, X } from 'lucide-react';
import './chat.css';
import { useLanguage } from '../../shared/i18n';
import { useChat } from '../../shared/chat';
import { relativeTime } from '../../shared/useUnifiedItems';
import Avatar from '../../shared/components/Avatar';
import { getConversations, startDirect, getSuggestedDirects } from '../../services/chatService';
import { socialApi } from '../social/socialData';
import ChatThread from './ChatThread';
import NewGroupModal from './NewGroupModal';
import GroupIcon from './GroupIcon';

const FILTERS = ['all', 'direct', 'group'];

const readFilter = () => {
  try {
    const v = localStorage.getItem('myrank_chat_filter');
    return FILTERS.includes(v) ? v : 'all';
  } catch {
    return 'all';
  }
};

// "João" acha "joao": sem acento e sem maiúscula
const plain = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Mensagens: a lista à esquerda (busca, "nova mensagem", Tudo · Diretas · Grupos
 * e o "diga oi" pra quem se segue com você e ainda não conversou) e a conversa à
 * direita. O lápis troca a lista por quem você segue, pra começar uma conversa
 * ou criar um grupo.
 * `onLeave`: a conversa foi aberta de outra tela (perfil, feed); o ← dela volta pra lá.
 * `onActiveChange(id)`: avisa qual conversa está aberta.
 */
export default function ChatPanel({ initialConvId = null, onInitialConvConsumed, onOpenProfile, onLeave, onActiveChange }) {
  const { t, lang } = useLanguage();
  const tc = t.chat;
  const { unreadCount, refreshCount, pendingPeer, consumePendingPeer, touchNonce } = useChat();
  const initialConvSeen = useRef(false);
  const didAutoOpen = useRef(false);

  const [conversations, setConversations] = useState(null);
  const [suggested, setSuggested] = useState([]); // mútuos sem DM ainda ("diga oi")
  const [activeId, setActiveId] = useState(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [filter, setFilter] = useState(readFilter);
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(false); // "nova mensagem": a lista vira quem você segue
  const [following, setFollowing] = useState(null);
  const [startError, setStartError] = useState('');

  const changeFilter = (next) => {
    setFilter(next);
    try {
      localStorage.setItem('myrank_chat_filter', next);
    } catch {
      /* ignore */
    }
  };

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await getConversations());
    } catch {
      setConversations([]);
    }
  }, []);

  const loadSuggested = useCallback(async () => {
    try {
      setSuggested(await getSuggestedDirects());
    } catch {
      setSuggested([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getConversations()
      .then((list) => {
        if (!active) return;
        setConversations(list);
        if (!didAutoOpen.current && list.length > 0 && initialConvId == null && !pendingPeer) {
          didAutoOpen.current = true;
          setActiveId((cur) => (cur == null ? list[0].id : cur));
        }
      })
      .catch(() => {
        if (active) setConversations([]);
      });
    return () => { active = false; };
  }, [unreadCount, touchNonce, initialConvId, pendingPeer]);

  useEffect(() => {
    let active = true;
    getSuggestedDirects()
      .then((list) => { if (active) setSuggested(list); })
      .catch(() => { if (active) setSuggested([]); });
    return () => { active = false; };
  }, [touchNonce]);

  // Abre a conversa que veio de /chat/invite/:token (uma vez só).
  useEffect(() => {
    if (initialConvId == null || initialConvSeen.current) return;
    initialConvSeen.current = true;
    setActiveId(initialConvId);
    loadConversations();
    onInitialConvConsumed?.();
  }, [initialConvId, loadConversations, onInitialConvConsumed]);

  // pedido externo: botão "Mensagem" no perfil de alguém → abre/cria o DM
  useEffect(() => {
    if (!pendingPeer) return;
    consumePendingPeer();
    startDirect(pendingPeer.id)
      .then((conv) => {
        setActiveId(conv.id);
        loadConversations();
        loadSuggested();
      })
      .catch(() => {});
  }, [pendingPeer, consumePendingPeer, loadConversations, loadSuggested]);

  useEffect(() => {
    onActiveChange?.(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const openComposer = () => {
    setComposing(true);
    setStartError('');
    if (following === null) socialApi.getFollowing().then(setFollowing).catch(() => setFollowing([]));
  };
  const closeComposer = () => {
    setComposing(false);
    setQuery('');
  };

  const active = conversations?.find((c) => c.id === activeId) || null;
  const q = plain(query.trim());
  const titleOf = (c) => (c.type === 'GROUP' ? c.name : c.peer?.username ?? '—');

  const visible = conversations?.filter((c) =>
    (filter === 'all' ? true : filter === 'direct' ? c.type === 'DIRECT' : c.type === 'GROUP')
    && (!q || plain(titleOf(c)).includes(q) || plain(c.lastMessage).includes(q)),
  );

  const dmPeerIds = new Set(
    (conversations || []).filter((c) => c.type === 'DIRECT').map((c) => c.peer?.id),
  );
  const suggestedVisible = filter === 'group'
    ? []
    : suggested.filter((u) => !dmPeerIds.has(u.id) && (!q || plain(u.username).includes(q)));

  // começa (ou reabre) a conversa com alguém: do "diga oi" ou da "nova mensagem"
  const openDirect = (u) => {
    setStartError('');
    startDirect(u.id)
      .then((conv) => {
        setSuggested((prev) => prev.filter((x) => x.id !== u.id));
        closeComposer();
        setActiveId(conv.id);
        loadConversations();
      })
      .catch((err) => setStartError(err?.response?.data?.message || tc.actionError));
  };

  const closeThread = () => {
    setActiveId(null);
    loadConversations();
    refreshCount();
  };

  const handleGroupCreated = (conv) => {
    setShowNewGroup(false);
    loadConversations();
    setActiveId(conv.id);
  };

  const handleConversationChanged = () => {
    loadConversations();
    refreshCount();
  };

  const personRow = (u, preview, onClick) => (
    <button key={`u-${u.id}`} type="button" className="chat-conv chat-conv--ghost" onClick={onClick}>
      <Avatar user={{ id: u.id, username: u.username, avatarUrl: u.avatarUrl }} className="chat-conv-avatar" />
      <div className="chat-conv-main">
        <div className="chat-conv-top"><span className="chat-conv-name">{u.username}</span></div>
        {preview && <div className="chat-conv-preview">{preview}</div>}
      </div>
    </button>
  );

  // nova mensagem: criar grupo em cima e quem você segue embaixo
  const composer = () => {
    const people = (following || []).filter((u) => !q || plain(u.username).includes(q));
    return (
      <>
        <button type="button" className="chat-conv" onClick={() => { closeComposer(); setShowNewGroup(true); }}>
          <span className="chat-conv-avatar is-icon" aria-hidden="true"><Users size={18} strokeWidth={2} /></span>
          <div className="chat-conv-main"><span className="chat-conv-name">{tc.newGroup}</span></div>
        </button>
        <div className="chat-list-label">{tc.followingLabel}</div>
        {following === null ? (
          <div className="chat-hint">{tc.loading}</div>
        ) : people.length === 0 ? (
          <div className="chat-hint">{q ? tc.noMatch : t.social.connections.noFollowing}</div>
        ) : (
          people.map((u) => personRow(u, null, () => openDirect(u)))
        )}
      </>
    );
  };

  const inbox = () => {
    if (conversations === null) return <div className="chat-hint">{tc.loading}</div>;
    if (visible.length === 0 && suggestedVisible.length === 0) {
      return <div className="chat-hint">{q ? tc.noMatch : conversations.length === 0 ? tc.inboxEmpty : tc.noneInFilter}</div>;
    }
    return (
      <>
        {visible.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chat-conv ${activeId === c.id ? 'active' : ''} ${c.unread > 0 ? 'is-unread' : ''}`}
            onClick={() => setActiveId(c.id)}
          >
            {c.type === 'GROUP' ? (
              <GroupIcon name={c.name} imageUrl={c.imageUrl} className="chat-conv-avatar" />
            ) : (
              <Avatar
                user={{ id: c.peer?.id, username: c.peer?.username, avatarUrl: c.peer?.avatarUrl }}
                className="chat-conv-avatar"
              />
            )}
            <div className="chat-conv-main">
              <div className="chat-conv-top">
                <span className="chat-conv-name">{titleOf(c)}</span>
                <span className="chat-conv-time">{c.lastAt ? relativeTime(c.lastAt, lang) : ''}</span>
              </div>
              <div className="chat-conv-preview">{renderPreview(c, tc)}</div>
            </div>
            {c.unread > 0 && <span className="chat-conv-badge">{c.unread > 9 ? '9+' : c.unread}</span>}
          </button>
        ))}

        {suggestedVisible.length > 0 && (
          <>
            <div className="chat-list-label">{tc.sayHi}</div>
            {suggestedVisible.map((u) => personRow(u, tc.mutual, () => openDirect(u)))}
          </>
        )}
      </>
    );
  };

  return (
    <div className={`chat-panel ${activeId ? 'has-active' : ''}`}>
      <aside className="chat-list">
        <div className="chat-list-head">
          <label className="chat-search">
            <Search size={15} strokeWidth={1.8} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={composing ? tc.searchPeople : tc.searchPlaceholder}
              aria-label={composing ? tc.searchPeople : tc.searchPlaceholder}
            />
          </label>
          <button
            type="button"
            className={`chat-icon-btn${composing ? ' is-active' : ''}`}
            onClick={composing ? closeComposer : openComposer}
            aria-label={composing ? tc.back : tc.newMessage}
            title={composing ? tc.back : tc.newMessage}
          >
            {composing ? <X size={16} strokeWidth={2} /> : <SquarePen size={16} strokeWidth={2} />}
          </button>
        </div>

        {composing ? (
          <div className="chat-list-label is-title">{tc.newMessage}</div>
        ) : (
          <div className="chat-tabs" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                className={`chat-tab${filter === f ? ' is-active' : ''}`}
                onClick={() => changeFilter(f)}
              >
                {tc.filters[f]}
              </button>
            ))}
          </div>
        )}

        {startError && <div className="chat-hint is-error" role="alert">{startError}</div>}
        <div className="chat-conv-list">{composing ? composer() : inbox()}</div>
      </aside>

      <section className="chat-main">
        {active ? (
          <ChatThread
            conversation={active}
            onBack={onLeave ? () => { closeThread(); onLeave(); } : closeThread}
            backAlways={!!onLeave}
            onChanged={handleConversationChanged}
            onLeft={closeThread}
            onOpenProfile={onOpenProfile}
          />
        ) : (
          <div className="chat-empty">
            <span className="chat-empty-icon" aria-hidden="true"><MessageSquare size={24} strokeWidth={1.8} /></span>
            <div className="chat-empty-title">{tc.emptyTitle}</div>
            <p>{tc.mutualHint}</p>
            <div className="chat-empty-actions">
              <button type="button" className="mr-btn mr-btn-gold mr-btn-sm" onClick={openComposer}>
                <SquarePen size={14} strokeWidth={2} aria-hidden="true" />
                {tc.newMessage}
              </button>
              <button type="button" className="mr-btn mr-btn-outline mr-btn-sm" onClick={() => setShowNewGroup(true)}>
                <Users size={14} strokeWidth={2} aria-hidden="true" />
                {tc.newGroup}
              </button>
            </div>
          </div>
        )}
      </section>

      {showNewGroup && (
        <NewGroupModal onClose={() => setShowNewGroup(false)} onCreated={handleGroupCreated} />
      )}
    </div>
  );
}

function renderPreview(c, tc) {
  if (!c.lastMessage) return tc.noMessages;
  if (c.lastKind === 'SYSTEM') return c.lastMessage;
  if (c.lastMine) return `${tc.youPrefix}${c.lastMessage}`;
  if (c.type === 'GROUP' && c.lastSenderName) return `${c.lastSenderName}: ${c.lastMessage}`;
  return c.lastMessage;
}
