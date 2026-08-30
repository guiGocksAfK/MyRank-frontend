import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../shared/i18n';
import { useChat } from '../../shared/chat';
import { relativeTime } from '../../shared/useUnifiedItems';
import Avatar from '../../shared/components/Avatar';
import GroupIcon from './GroupIcon';
import GroupPanel from './GroupPanel';
import {
  CHAT_EMOJIS,
  getMessages,
  markConversationRead,
  sendMessage,
  editMessage,
  deleteMessage,
  reactMessage,
} from '../../services/chatService';

const POLL_MS = 15_000;
const BODY_MAX = 2000;
const GROUP_GAP_MS = 5 * 60 * 1000;

const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a1 1 0 00-1.4 1.15L4 11l10 1-10 1-2 6.25a1 1 0 001.4 1.15z" />
  </svg>
);

/** Conversa aberta. `conversation` = { id, type, name, imageUrl, peer, memberCount, myRole }. */
export default function ChatThread({ conversation, onBack, onChanged, onLeft }) {
  const { t, lang } = useLanguage();
  const tc = t.chat;
  const { refreshCount } = useChat();
  const isGroup = conversation.type === 'GROUP';
  const canModerate = ['OWNER', 'ADMIN', 'MOD'].includes(conversation.myRole);

  const [messages, setMessages] = useState(null);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [menuFor, setMenuFor] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const patchMessage = useCallback((updated) => {
    setMessages((prev) => (prev || []).map((m) => (m.id === updated.id ? updated : m)));
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
    setReplyTo(null);
    setEditing(null);
    setMenuFor(null);
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => load({ silent: true }), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (messages && !editing) scrollToBottom();
  }, [messages, editing, scrollToBottom]);

  // fecha o menu ao clicar fora
  useEffect(() => {
    if (menuFor == null) return undefined;
    const close = () => setMenuFor(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuFor]);

  const canSend = draft.trim().length > 0 && draft.length <= BODY_MAX && !sending;

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!canSend) return;
    const body = draft.trim();

    if (editing) {
      setSending(true);
      try {
        const updated = await editMessage(editing.id, body);
        patchMessage(updated);
        setEditing(null);
        setDraft('');
        setError(null);
      } catch (err) {
        setError(err?.response?.data?.message || tc.editError);
      } finally {
        setSending(false);
      }
      return;
    }

    setSending(true);
    setDraft('');
    try {
      const saved = await sendMessage(conversation.id, body, replyTo?.id ?? null);
      setMessages((prev) => [...(prev || []), saved]);
      setReplyTo(null);
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

  const startEdit = (m) => {
    setMenuFor(null);
    setReplyTo(null);
    setEditing(m);
    setDraft(m.body || '');
    inputRef.current?.focus();
  };

  const startReply = (m) => {
    setMenuFor(null);
    setEditing(null);
    setDraft('');
    setReplyTo(m);
    inputRef.current?.focus();
  };

  const doDelete = async (m) => {
    setMenuFor(null);
    try {
      const updated = await deleteMessage(m.id);
      patchMessage(updated);
      onChanged?.();
    } catch (err) {
      setError(err?.response?.data?.message || tc.actionError);
    }
  };

  const doReact = async (m, emoji) => {
    setMenuFor(null);
    try {
      const updated = await reactMessage(m.id, emoji);
      patchMessage(updated);
    } catch (err) {
      setError(err?.response?.data?.message || tc.actionError);
    }
  };

  const jumpTo = (id) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.add('is-flash');
    setTimeout(() => el.classList.remove('is-flash'), 1200);
  };

  const headerTitle = isGroup ? conversation.name : `@${conversation.peer?.username ?? '—'}`;

  const rows = useMemo(() => withHeaders(messages || []), [messages]);

  return (
    <div className="chat-thread">
      <div className="chat-thread-head">
        <button type="button" className="chat-back" onClick={onBack} aria-label={tc.back}>
          ←
        </button>
        {isGroup ? (
          <GroupIcon name={conversation.name} imageUrl={conversation.imageUrl} className="chat-thread-avatar" />
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
              {tc.memberCount.replace('{n}', conversation.memberCount)}
              {conversation.pendingRequests > 0 && canModerate && (
                <span className="chat-pending-dot"> · {tc.pendingN.replace('{n}', conversation.pendingRequests)}</span>
              )}
              {' · '}{tc.manage}
            </button>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {messages === null ? (
          <div className="chat-hint">{tc.loading}</div>
        ) : rows.length === 0 ? (
          <div className="chat-hint">{tc.threadEmpty}</div>
        ) : (
          rows.map(({ m, showHeader }) =>
            m.kind === 'SYSTEM' ? (
              <div key={m.id} id={`msg-${m.id}`} className="chat-system">{m.body}</div>
            ) : (
              <MessageRow
                key={m.id}
                m={m}
                showHeader={showHeader}
                isGroup={isGroup}
                lang={lang}
                tc={tc}
                canModerate={canModerate}
                menuOpen={menuFor === m.id}
                onOpenMenu={(e) => {
                  e.stopPropagation();
                  setMenuFor((cur) => (cur === m.id ? null : m.id));
                }}
                onReact={(emoji) => doReact(m, emoji)}
                onReply={() => startReply(m)}
                onEdit={() => startEdit(m)}
                onDelete={() => doDelete(m)}
                onJump={jumpTo}
              />
            ),
          )
        )}
        <div ref={bottomRef} />
      </div>

      {error && <div className="chat-error" onClick={() => setError(null)}>{error}</div>}

      {(replyTo || editing) && (
        <div className="chat-context-bar">
          <div className="chat-context-info">
            <span className="chat-context-label">
              {editing ? tc.editing : `${tc.replyingTo} ${replyTo.mine ? tc.you : replyTo.senderName || '—'}`}
            </span>
            <span className="chat-context-snippet">
              {editing ? editing.body : (replyTo.deleted ? tc.deletedMsg : replyTo.body)}
            </span>
          </div>
          <button
            type="button"
            className="chat-context-x"
            onClick={() => {
              setReplyTo(null);
              setEditing(null);
              if (editing) setDraft('');
            }}
          >
            ✕
          </button>
        </div>
      )}

      <form className="chat-composer" onSubmit={submit}>
        <textarea
          ref={inputRef}
          className="chat-input"
          rows={1}
          value={draft}
          maxLength={BODY_MAX}
          placeholder={editing ? tc.editPlaceholder : tc.placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
            if (e.key === 'Escape') {
              setReplyTo(null);
              setEditing(null);
              setDraft(editing ? '' : draft);
            }
          }}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!canSend}
          aria-label={editing ? tc.save : tc.send}
        >
          {editing ? '✓' : <SendIcon />}
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

/** anexa showHeader (primeira de uma sequência do mesmo autor). */
function withHeaders(list) {
  return list.map((m, i) => {
    const prev = list[i - 1];
    const showHeader =
      !prev ||
      prev.kind === 'SYSTEM' ||
      m.kind === 'SYSTEM' ||
      prev.senderId !== m.senderId ||
      new Date(m.createdAt) - new Date(prev.createdAt) > GROUP_GAP_MS;
    return { m, showHeader };
  });
}

function MessageRow({
  m, showHeader, isGroup, lang, tc, canModerate,
  menuOpen, onOpenMenu, onReact, onReply, onEdit, onDelete, onJump,
}) {
  const showAvatar = isGroup && !m.mine;
  const canEdit = m.mine && !m.deleted;
  const canDelete = (m.mine || canModerate) && !m.deleted;

  return (
    <div
      id={`msg-${m.id}`}
      className={`chat-bubble-row ${m.mine ? 'is-mine' : ''} ${showHeader ? '' : 'is-cont'}`}
    >
      {showAvatar && (
        <div className="chat-row-avatar">
          {showHeader ? (
            <Avatar
              user={{ id: m.senderId, username: m.senderName, avatarUrl: m.senderAvatarUrl }}
              className="chat-msg-avatar"
            />
          ) : null}
        </div>
      )}

      <div className="chat-bubble-wrap">
        {showAvatar && showHeader && (
          <span className="chat-bubble-sender">{m.senderName || '—'}</span>
        )}

        <div className="chat-bubble">
          {m.replyTo && (
            <button
              type="button"
              className="chat-reply-quote"
              onClick={() => onJump(m.replyTo.id)}
            >
              <span className="chat-reply-quote-name">{m.replyTo.senderName || '—'}</span>
              <span className="chat-reply-quote-text">
                {m.replyTo.deleted ? tc.deletedMsg : m.replyTo.excerpt}
              </span>
            </button>
          )}

          {m.deleted ? (
            <span className="chat-bubble-body is-deleted">🚫 {tc.deletedMsg}</span>
          ) : (
            <span className="chat-bubble-body">{m.body}</span>
          )}

          <span className="chat-bubble-time">
            {m.edited && !m.deleted && <span className="chat-edited">{tc.editedTag} </span>}
            {relativeTime(m.createdAt, lang)}
          </span>

          {!m.deleted && (
            <button
              type="button"
              className="chat-msg-trigger"
              onClick={onOpenMenu}
              aria-label={tc.messageActions}
            >
              ⋯
            </button>
          )}

          {menuOpen && (
            <div className="chat-msg-menu" onClick={(e) => e.stopPropagation()}>
              <div className="chat-emoji-row">
                {CHAT_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className="chat-emoji-btn"
                    onClick={() => onReact(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="chat-menu-actions">
                <button type="button" onClick={onReply}>↩ {tc.reply}</button>
                {canEdit && <button type="button" onClick={onEdit}>✏️ {tc.edit}</button>}
                {canDelete && <button type="button" className="is-danger" onClick={onDelete}>🗑 {tc.delete}</button>}
              </div>
            </div>
          )}
        </div>

        {m.reactions?.length > 0 && (
          <div className="chat-reactions">
            {m.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                className={`chat-reaction ${r.mine ? 'is-mine' : ''}`}
                onClick={() => onReact(r.emoji)}
              >
                {r.emoji} {r.count}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
