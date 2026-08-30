import { useCallback, useEffect, useRef, useState } from 'react';
import './chat.css';
import { useLanguage } from '../../shared/i18n';
import { useChat } from '../../shared/chat';
import { relativeTime } from '../../shared/useUnifiedItems';
import Avatar from '../../shared/components/Avatar';
import { getConversations, startDirect, getSuggestedDirects } from '../../services/chatService';
import ChatThread from './ChatThread';
import NewGroupModal from './NewGroupModal';
import GroupIcon from './GroupIcon';
import GroupDirectory from './GroupDirectory';

const FILTERS = ['all', 'direct', 'group'];

const readFilter = () => {
  try {
    const v = localStorage.getItem('myrank_chat_filter');
    return FILTERS.includes(v) ? v : 'all';
  } catch {
    return 'all';
  }
};

export default function ChatPanel({ initialConvId = null, onInitialConvConsumed, onOpenProfile }) {
  const { t, lang } = useLanguage();
  const tc = t.chat;
  const { unreadCount, refreshCount, pendingPeer, consumePendingPeer, touchNonce } = useChat();
  const initialConvSeen = useRef(false);

  const [conversations, setConversations] = useState(null);
  const [suggested, setSuggested] = useState([]); // mútuos sem DM ainda ("diga oi")
  const [activeId, setActiveId] = useState(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [filter, setFilter] = useState(readFilter);

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
    loadConversations();
  }, [loadConversations, unreadCount, touchNonce]);

  useEffect(() => {
    loadSuggested();
  }, [loadSuggested, touchNonce]);

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

  const active = conversations?.find((c) => c.id === activeId) || null;

  const visible = conversations?.filter((c) =>
    filter === 'all' ? true : filter === 'direct' ? c.type === 'DIRECT' : c.type === 'GROUP',
  );

  const dmPeerIds = new Set(
    (conversations || []).filter((c) => c.type === 'DIRECT').map((c) => c.peer?.id),
  );
  const suggestedVisible =
    filter === 'group' ? [] : suggested.filter((u) => !dmPeerIds.has(u.id));

  const openSuggested = (u) => {
    startDirect(u.id)
      .then((conv) => {
        setSuggested((prev) => prev.filter((x) => x.id !== u.id));
        setActiveId(conv.id);
        loadConversations();
      })
      .catch(() => {});
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

  const openFromDirectory = (id) => {
    setShowDirectory(false);
    setActiveId(id);
    loadConversations();
  };

  if (showDirectory) {
    return (
      <div className="chat-panel">
        <GroupDirectory onBack={() => setShowDirectory(false)} onOpen={openFromDirectory} />
      </div>
    );
  }

  return (
    <div className={`chat-panel ${activeId ? 'has-active' : ''}`}>
      <aside className="chat-list">
        <div className="chat-list-head">
          <span>{tc.title}</span>
          <div className="chat-list-head-btns">
            <button type="button" className="chat-newgroup-btn" onClick={() => setShowDirectory(true)}>
              {tc.discover}
            </button>
            <button type="button" className="chat-newgroup-btn" onClick={() => setShowNewGroup(true)}>
              {tc.newGroup}
            </button>
          </div>
        </div>

        <div className="chat-filter" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              className={`chat-filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => changeFilter(f)}
            >
              {tc.filters[f]}
            </button>
          ))}
        </div>

        {conversations === null ? (
          <div className="chat-hint">{tc.loading}</div>
        ) : visible.length === 0 && suggestedVisible.length === 0 ? (
          <div className="chat-hint">
            {conversations.length === 0 ? tc.inboxEmpty : tc.noneInFilter}
          </div>
        ) : (
          <>
            {visible.map((c) => {
              const title = c.type === 'GROUP' ? c.name : `@${c.peer?.username ?? '—'}`;
              const preview = renderPreview(c, tc);
              return (
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
                      <span className="chat-conv-name">
                        {c.type === 'GROUP' && <span aria-hidden="true">👥 </span>}
                        {title}
                      </span>
                      <span className="chat-conv-time">{c.lastAt ? relativeTime(c.lastAt, lang) : ''}</span>
                    </div>
                    <div className="chat-conv-preview">{preview}</div>
                  </div>
                  {c.unread > 0 && (
                    <span className="chat-conv-badge">{c.unread > 9 ? '9+' : c.unread}</span>
                  )}
                </button>
              );
            })}

            {suggestedVisible.map((u) => (
              <button
                key={`sg-${u.id}`}
                type="button"
                className="chat-conv chat-conv--ghost"
                onClick={() => openSuggested(u)}
              >
                <Avatar
                  user={{ id: u.id, username: u.username, avatarUrl: u.avatarUrl }}
                  className="chat-conv-avatar"
                />
                <div className="chat-conv-main">
                  <div className="chat-conv-top">
                    <span className="chat-conv-name">@{u.username}</span>
                  </div>
                  <div className="chat-conv-preview">{tc.sayHi}</div>
                </div>
              </button>
            ))}
          </>
        )}
      </aside>

      <section className="chat-main">
        {active ? (
          <ChatThread
            conversation={active}
            onBack={closeThread}
            onChanged={handleConversationChanged}
            onLeft={closeThread}
            onOpenProfile={onOpenProfile}
          />
        ) : (
          <div className="chat-empty">
            <div className="chat-empty-icon" aria-hidden="true">💬</div>
            <p>{tc.pickConversation}</p>
            <p className="chat-empty-hint">{tc.mutualHint}</p>
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
