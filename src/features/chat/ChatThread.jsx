import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../shared/i18n';
import { useChat } from '../../shared/chat';
import { relativeTime } from '../../shared/useUnifiedItems';
import Avatar from '../../shared/components/Avatar';
import {
  getConversation,
  markConversationRead,
  sendMessage,
} from '../../services/chatService';

const POLL_MS = 15_000;
const BODY_MAX = 2000;

/** Conversa aberta com um interlocutor. `peer` = { id, username, avatarUrl }. */
export default function ChatThread({ peer, onBack }) {
  const { t, lang } = useLanguage();
  const tc = t.chat;
  const { refreshCount } = useChat();

  const [messages, setMessages] = useState(null); // null = carregando
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setMessages(null);
      try {
        const rows = await getConversation(peer.id);
        setMessages(rows);
        setError(null);
        markConversationRead(peer.id).then(refreshCount).catch(() => {});
      } catch (err) {
        setError(err?.response?.data?.message || tc.loadError);
        if (!silent) setMessages([]);
      }
    },
    [peer.id, refreshCount, tc.loadError],
  );

  // troca de conversa → recarrega
  useEffect(() => {
    load();
  }, [load]);

  // polling enquanto a conversa está aberta
  useEffect(() => {
    const id = setInterval(() => load({ silent: true }), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // rola pro fim quando a lista muda
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
      const saved = await sendMessage(peer.id, body);
      setMessages((prev) => [...(prev || []), saved]);
      setError(null);
      requestAnimationFrame(() => scrollToBottom(true));
    } catch (err) {
      setError(err?.response?.data?.message || tc.sendError);
      setDraft(body); // devolve o texto pra não perder
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-thread">
      <div className="chat-thread-head">
        <button type="button" className="chat-back" onClick={onBack} aria-label={tc.back}>
          ←
        </button>
        <Avatar
          user={{ id: peer.id, username: peer.username, avatarUrl: peer.avatarUrl }}
          className="chat-thread-avatar"
        />
        <div className="chat-thread-name">@{peer.username}</div>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        {messages === null ? (
          <div className="chat-hint">{tc.loading}</div>
        ) : messages.length === 0 ? (
          <div className="chat-hint">{tc.threadEmpty}</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`chat-bubble-row ${m.mine ? 'is-mine' : ''}`}>
              <div className="chat-bubble">
                <span className="chat-bubble-body">{m.body}</span>
                <span className="chat-bubble-time">{relativeTime(m.createdAt, lang)}</span>
              </div>
            </div>
          ))
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
    </div>
  );
}
