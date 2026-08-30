import { useCallback, useEffect, useState } from 'react';
import './chat.css';
import { useLanguage } from '../../shared/i18n';
import { useChat } from '../../shared/chat';
import { relativeTime } from '../../shared/useUnifiedItems';
import Avatar from '../../shared/components/Avatar';
import { getConversations } from '../../services/chatService';
import ChatThread from './ChatThread';

export default function ChatPanel() {
  const { t, lang } = useLanguage();
  const tc = t.chat;
  const { unreadCount, refreshCount, pendingPeer, consumePendingPeer } = useChat();

  const [conversations, setConversations] = useState(null);
  const [active, setActive] = useState(null); // { id, username, avatarUrl }

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

  // pedido externo de abrir conversa (botão "Mensagem" no perfil)
  useEffect(() => {
    if (pendingPeer) {
      setActive(pendingPeer);
      consumePendingPeer();
    }
  }, [pendingPeer, consumePendingPeer]);

  const openThread = (peer) => setActive(peer);

  const closeThread = () => {
    setActive(null);
    loadConversations();
    refreshCount();
  };

  return (
    <div className={`chat-panel ${active ? 'has-active' : ''}`}>
      <aside className="chat-list">
        <div className="chat-list-head">{tc.title}</div>

        {conversations === null ? (
          <div className="chat-hint">{tc.loading}</div>
        ) : conversations.length === 0 ? (
          <div className="chat-hint">{tc.inboxEmpty}</div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.peerId}
              type="button"
              className={`chat-conv ${active?.id === c.peerId ? 'active' : ''} ${c.unread > 0 ? 'is-unread' : ''}`}
              onClick={() =>
                openThread({ id: c.peerId, username: c.peerUsername, avatarUrl: c.peerAvatarUrl })
              }
            >
              <Avatar
                user={{ id: c.peerId, username: c.peerUsername, avatarUrl: c.peerAvatarUrl }}
                className="chat-conv-avatar"
              />
              <div className="chat-conv-main">
                <div className="chat-conv-top">
                  <span className="chat-conv-name">@{c.peerUsername}</span>
                  <span className="chat-conv-time">{relativeTime(c.lastAt, lang)}</span>
                </div>
                <div className="chat-conv-preview">
                  {c.lastMine ? <span className="chat-conv-you">{tc.youPrefix}</span> : null}
                  {c.lastMessage}
                </div>
              </div>
              {c.unread > 0 && (
                <span className="chat-conv-badge">{c.unread > 9 ? '9+' : c.unread}</span>
              )}
            </button>
          ))
        )}
      </aside>

      <section className="chat-main">
        {active ? (
          <ChatThread peer={active} onBack={closeThread} />
        ) : (
          <div className="chat-empty">
            <div className="chat-empty-icon" aria-hidden="true">💬</div>
            <p>{tc.pickConversation}</p>
            <p className="chat-empty-hint">{tc.mutualHint}</p>
          </div>
        )}
      </section>
    </div>
  );
}
