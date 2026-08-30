import { useCallback, useEffect, useState } from 'react';
import './chat.css';
import { useLanguage } from '../../shared/i18n';
import { useChat } from '../../shared/chat';
import { relativeTime } from '../../shared/useUnifiedItems';
import Avatar from '../../shared/components/Avatar';
import { getConversations, startDirect } from '../../services/chatService';
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

export default function ChatPanel() {
  const { t, lang } = useLanguage();
  const tc = t.chat;
  const { unreadCount, refreshCount, pendingPeer, consumePendingPeer } = useChat();

  const [conversations, setConversations] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
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

  useEffect(() => {
    loadConversations();
  }, [loadConversations, unreadCount]);

  // pedido externo: botão "Mensagem" no perfil de alguém → abre/cria o DM
  useEffect(() => {
    if (!pendingPeer) return;
    consumePendingPeer();
    startDirect(pendingPeer.id)
      .then((conv) => {
        setActiveId(conv.id);
        loadConversations();
      })
      .catch(() => {});
  }, [pendingPeer, consumePendingPeer, loadConversations]);

  const active = conversations?.find((c) => c.id === activeId) || null;

  const visible = conversations?.filter((c) =>
    filter === 'all' ? true : filter === 'direct' ? c.type === 'DIRECT' : c.type === 'GROUP',
  );

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

  return (
    <div className={`chat-panel ${activeId ? 'has-active' : ''}`}>
      <aside className="chat-list">
        <div className="chat-list-head">
          <span>{tc.title}</span>
          <button type="button" className="chat-newgroup-btn" onClick={() => setShowNewGroup(true)}>
            {tc.newGroup}
          </button>
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
        ) : conversations.length === 0 ? (
          <div className="chat-hint">{tc.inboxEmpty}</div>
        ) : visible.length === 0 ? (
          <div className="chat-hint">{tc.noneInFilter}</div>
        ) : (
          visible.map((c) => {
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
                  <GroupIcon name={c.name} className="chat-conv-avatar" />
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
          })
        )}
      </aside>

      <section className="chat-main">
        {active ? (
          <ChatThread
            conversation={active}
            onBack={closeThread}
            onChanged={handleConversationChanged}
            onLeft={closeThread}
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
