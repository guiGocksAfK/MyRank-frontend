import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../shared/i18n';
import { useChat } from '../../shared/chat';
import { relativeTime } from '../../shared/useUnifiedItems';
import Avatar from '../../shared/components/Avatar';
import GroupIcon from './GroupIcon';
import GroupPanel from './GroupPanel';
import {
  getMessages,
  markConversationRead,
  sendMessage,
} from '../../services/chatService';

const POLL_MS = 15_000;
const BODY_MAX = 2000;

/** Conversa aberta. `conversation` = { id, type, name, peer, memberCount, myRole }. */
export default function ChatThread({ conversation, onBack, onChanged, onLeft }) {
  const { t, lang } = useLanguage();
  const tc = t.chat;
  const { refreshCount } = useChat();
  const isGroup = conversation.type === 'GROUP';

  const [messages, setMessages] = useState(null);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const bottomRef = useRef(null);
  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setMessages(null);
      try {
        const rows = await getMessages(conversation.id);
        setMessages(rows);
        setError(null);
        markConversationRead(conversation.id).then(refreshCount).catch(() => {});
      } catch (err) {
        setError(err?.response?.data?.message || tc.loadError);
        if (!silent) setMessages([]);
      }
    },
    [conversation.id, refreshCount, tc.loadError],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => load({ silent: true }), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (messages) scrollToBottom();
  }, [messages, scrollToBottom]);

  const canSend = draft.trim().length > 0 && draft.length <= BODY_MAX && !sending;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!canSend) return;
    const body = draft.trim();
    setSending(true);
    setDraft('');
    try {
      const saved = await sendMessage(conversation.id, body);
      setMessages((prev) => [...(prev || []), saved]);
      setError(null);
      onChanged?.();
      requestAnimationFrame(() => scrollToBottom(true));
    } catch (err) {
      setError(err?.response?.data?.message || tc.sendError);
      setDraft(body);
    } finally {
      setSending(false);
    }
  };

  const headerTitle = isGroup ? conversation.name : `@${conversation.peer?.username ?? '—'}`;

  return (
    <div className="chat-thread">
      <div className="chat-thread-head">
        <button type="button" className="chat-back" onClick={onBack} aria-label={tc.back}>
          ←
        </button>
        {isGroup ? (
          <GroupIcon name={conversation.name} className="chat-thread-avatar" />
        ) : (
          <Avatar
            user={{
              id: conversation.peer?.id,
              username: conversation.peer?.username,
              avatarUrl: conversation.peer?.avatarUrl,
            }}
            className="chat-thread-avatar"
          />
        )}
        <div className="chat-thread-titlewrap">
          <div className="chat-thread-name">
            {isGroup && <span aria-hidden="true">👥 </span>}
            {headerTitle}
          </div>
          {isGroup && (
            <button type="button" className="chat-thread-sub" onClick={() => setShowPanel(true)}>
              {tc.memberCount.replace('{n}', conversation.memberCount)} · {tc.manage}
            </button>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {messages === null ? (
          <div className="chat-hint">{tc.loading}</div>
        ) : messages.length === 0 ? (
          <div className="chat-hint">{tc.threadEmpty}</div>
        ) : (
          messages.map((m) =>
            m.kind === 'SYSTEM' ? (
              <div key={m.id} className="chat-system">{m.body}</div>
            ) : (
              <div key={m.id} className={`chat-bubble-row ${m.mine ? 'is-mine' : ''}`}>
                <div className="chat-bubble">
                  {isGroup && !m.mine && (
                    <span className="chat-bubble-sender">{m.senderName || '—'}</span>
                  )}
                  <span className="chat-bubble-body">{m.body}</span>
                  <span className="chat-bubble-time">{relativeTime(m.createdAt, lang)}</span>
                </div>
              </div>
            ),
          )
        )}
        <div ref={bottomRef} />
      </div>

      {error && <div className="chat-error">{error}</div>}

      <form className="chat-composer" onSubmit={handleSend}>
        <textarea
          className="chat-input"
          rows={1}
          value={draft}
          maxLength={BODY_MAX}
          placeholder={tc.placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />
        <button type="submit" className="mr-btn mr-btn-gold mr-btn-sm" disabled={!canSend}>
          {sending ? tc.sending : tc.send}
        </button>
      </form>

      {showPanel && isGroup && (
        <GroupPanel
          conversation={conversation}
          onClose={() => setShowPanel(false)}
          onChanged={onChanged}
          onLeft={() => {
            setShowPanel(false);
            onLeft?.();
          }}
        />
      )}
    </div>
  );
}
