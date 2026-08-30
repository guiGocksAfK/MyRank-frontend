import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../shared/i18n';
import { useChat } from '../../shared/chat';
import { useUser } from '../../shared/userContext';
import { relativeTime } from '../../shared/useUnifiedItems';
import Avatar from '../../shared/components/Avatar';
import GroupIcon from './GroupIcon';
import GroupPanel from './GroupPanel';
import EmojiPicker from './EmojiPicker';
import {
  CHAT_EMOJIS,
  getMessages,
  markConversationRead,
  sendMessage,
  editMessage,
  deleteMessage,
  reactMessage,
  sendTyping,
} from '../../services/chatService';

const POLL_MS = 15_000;
const BODY_MAX = 2000;
const GROUP_GAP_MS = 5 * 60 * 1000; // agrupa mensagens seguidas do mesmo autor
const TIME_SEP_MS = 20 * 60 * 1000; // divisor de hora entre grupos
const PAGE_SIZE = 40;

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Rótulo do divisor: hoje → "18:49"; ontem → "Ontem 18:49"; senão → "12 de mai., 18:49". */
function timeSepLabel(iso, locale, tc) {
  const d = new Date(iso);
  const now = new Date();
  const hm = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (sameDay(d, now)) return hm;
  const yst = new Date(now);
  yst.setDate(now.getDate() - 1);
  if (sameDay(d, yst)) return `${tc.yesterday} ${hm}`;
  const datePart = d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
  return `${datePart}, ${hm}`;
}

/**
 * Transforma a lista crua em linhas de render:
 *  - { type: 'time', id, iso }                    divisor de hora
 *  - { type: 'system', id, items: [{id, body}] }  bloco de avisos (dedup consecutivo)
 *  - { type: 'msg', id, m, showHeader, showTail } mensagem
 */
function buildRows(list) {
  const rows = [];
  let i = 0;
  while (i < list.length) {
    const m = list[i];

    if (m.kind === 'SYSTEM') {
      const items = [];
      let lastBody = null;
      let j = i;
      while (j < list.length && list[j].kind === 'SYSTEM') {
        if (list[j].body !== lastBody) {
          items.push({ id: list[j].id, body: list[j].body });
          lastBody = list[j].body;
        }
        j++;
      }
      rows.push({ type: 'system', id: `sys-${m.id}`, items });
      i = j;
      continue;
    }

    const prev = list[i - 1];
    const next = list[i + 1];
    const created = new Date(m.createdAt);
    const prevIsMsg = prev && prev.kind !== 'SYSTEM';
    const nextIsMsg = next && next.kind !== 'SYSTEM';

    const needSep =
      !prev ||
      (prevIsMsg &&
        (!sameDay(new Date(prev.createdAt), created) || created - new Date(prev.createdAt) > TIME_SEP_MS));
    if (needSep) rows.push({ type: 'time', id: `t-${m.id}`, iso: m.createdAt });

    const showHeader =
      !prevIsMsg ||
      prev.senderId !== m.senderId ||
      created - new Date(prev.createdAt) > GROUP_GAP_MS;
    const showTail =
      !nextIsMsg ||
      next.senderId !== m.senderId ||
      new Date(next.createdAt) - created > GROUP_GAP_MS;

    rows.push({ type: 'msg', id: m.id, m, showHeader, showTail });
    i++;
  }
  return rows;
}

/** Insere o divisor "não lidas" antes da 1ª mensagem depois do cursor (se houver histórico acima). */
function withUnread(rows, anchorId) {
  if (!anchorId) return rows;
  const firstIdx = rows.findIndex((r) => r.type === 'msg' && r.m.id > anchorId);
  if (firstIdx <= 0) return rows; // não achou, ou é a primeira coisa da lista
  const hasMsgAbove = rows.slice(0, firstIdx).some((r) => r.type === 'msg');
  if (!hasMsgAbove) return rows;
  return [...rows.slice(0, firstIdx), { type: 'unread', id: 'unread-sep' }, ...rows.slice(firstIdx)];
}

/** Refresh silencioso: mescla a página 0 (mais recente) sem descartar histórico já carregado. */
function mergeRefresh(prev, fresh) {
  if (!prev || prev.length === 0) return fresh;
  const freshById = new Map(fresh.map((m) => [m.id, m]));
  const maxPrevId = prev.reduce((mx, m) => (m.id > mx ? m.id : mx), 0);
  const merged = prev.map((m) => freshById.get(m.id) || m);
  const appended = fresh.filter((m) => m.id > maxPrevId);
  return appended.length ? [...merged, ...appended] : merged;
}

/** "Carregar mais": prepende mensagens antigas ignorando ids já presentes. */
function mergePrepend(older, current) {
  const seen = new Set(current.map((m) => m.id));
  const add = older.filter((m) => !seen.has(m.id));
  return add.length ? [...add, ...current] : current;
}

const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a1 1 0 00-1.4 1.15L4 11l10 1-10 1-2 6.25a1 1 0 001.4 1.15z" />
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.5h.01" />
  </svg>
);

/** Conversa aberta. `conversation` = { id, type, name, imageUrl, peer, memberCount, myRole }. */
export default function ChatThread({ conversation, onBack, onChanged, onLeft, onOpenProfile }) {
  const { t, lang, locale } = useLanguage();
  const tc = t.chat;
  const { refreshCount, subscribeConversation } = useChat();
  const { user: me } = useUser();
  const myId = me?.id ?? null;
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
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typers, setTypers] = useState([]); // [{ id, name, at }] — quem está digitando
  const [peerReadId, setPeerReadId] = useState(conversation.peerLastReadId ?? null);
  const [unreadAnchor, setUnreadAnchor] = useState(0); // cursor no momento de abrir (divisor)

  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const pageRef = useRef(0);
  const typingSentRef = useRef(0);
  const prependHeightRef = useRef(0); // scrollHeight antes de prepender (0 = sem prepend pendente)
  const forceBottomRef = useRef(true); // força ir ao fim na carga inicial
  const nearBottomRef = useRef(true); // usuário estava perto do fim antes do último update
  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const onListScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  const patchMessage = useCallback((updated) => {
    setMessages((prev) => (prev || []).map((m) => (m.id === updated.id ? updated : m)));
  }, []);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setMessages(null);
        pageRef.current = 0;
        forceBottomRef.current = true;
      }
      try {
        const rows = await getMessages(conversation.id, 0, PAGE_SIZE);
        if (!silent) setHasMore(rows.length === PAGE_SIZE);
        setMessages((prev) => (silent ? mergeRefresh(prev, rows) : rows));
        setError(null);
        markConversationRead(conversation.id).then(refreshCount).catch(() => {});
      } catch (err) {
        setError(err?.response?.data?.message || tc.loadError);
        if (!silent) setMessages([]);
      }
    },
    [conversation.id, refreshCount, tc.loadError],
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = pageRef.current + 1;
    try {
      const older = await getMessages(conversation.id, next, PAGE_SIZE);
      pageRef.current = next;
      setHasMore(older.length === PAGE_SIZE);
      if (older.length) {
        prependHeightRef.current = listRef.current?.scrollHeight ?? 0;
        setMessages((prev) => mergePrepend(older, prev || []));
      }
    } catch (err) {
      setError(err?.response?.data?.message || tc.loadError);
    } finally {
      setLoadingMore(false);
    }
  }, [conversation.id, hasMore, loadingMore, tc.loadError]);

  useEffect(() => {
    setReplyTo(null);
    setEditing(null);
    setMenuFor(null);
    setTypers([]);
    setPeerReadId(conversation.peerLastReadId ?? null);
    setUnreadAnchor(conversation.unread > 0 ? conversation.myLastReadId ?? 0 : 0);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  // some com "digitando…" parado há mais de 4s
  useEffect(() => {
    if (typers.length === 0) return undefined;
    const id = setInterval(() => {
      setTypers((prev) => prev.filter((tp) => Date.now() - tp.at < 4000));
    }, 1000);
    return () => clearInterval(id);
  }, [typers.length]);

  useEffect(() => {
    const id = setInterval(() => load({ silent: true }), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Real-time: eventos da conversa aberta via STOMP (o poll acima é só fallback).
  useEffect(() => {
    const off = subscribeConversation(conversation.id, (evt) => {
      if (evt?.type === 'typing') {
        if (evt.actorId === myId) return;
        setTypers((prev) => [
          ...prev.filter((tp) => tp.id !== evt.actorId),
          { id: evt.actorId, name: evt.actorName, at: Date.now() },
        ]);
        return;
      }
      if (evt?.type === 'read') {
        if (evt.actorId !== myId && evt.lastReadId != null) setPeerReadId(evt.lastReadId);
        return;
      }

      const msg = evt?.message;
      if (!msg) return;
      const withMine = { ...msg, mine: msg.senderId === myId };

      if (evt.type === 'created') {
        setTypers((prev) => prev.filter((tp) => tp.id !== msg.senderId));
        setMessages((prev) => {
          const list = prev || [];
          if (list.some((m) => m.id === msg.id)) return list; // eco da própria mensagem
          return [...list, withMine];
        });
        markConversationRead(conversation.id).then(refreshCount).catch(() => {});
      } else if (evt.type === 'edited' || evt.type === 'deleted') {
        setMessages((prev) => (prev || []).map((m) => (m.id === msg.id ? withMine : m)));
      } else if (evt.type === 'reacted') {
        if (evt.actorId === myId) return; // meu react já foi aplicado pela resposta do POST
        setMessages((prev) =>
          (prev || []).map((m) => {
            if (m.id !== msg.id) return m;
            const myEmoji = (m.reactions || []).find((r) => r.mine)?.emoji;
            const reactions = (msg.reactions || []).map((r) => ({ ...r, mine: r.emoji === myEmoji }));
            return { ...withMine, reactions };
          }),
        );
      }
    });
    return off;
  }, [conversation.id, subscribeConversation, myId, refreshCount]);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el || !messages) return;
    if (prependHeightRef.current) {
      el.scrollTop = el.scrollHeight - prependHeightRef.current; // segura a posição após prepender
      prependHeightRef.current = 0;
      return;
    }
    if (forceBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      forceBottomRef.current = false;
      return;
    }
    if (nearBottomRef.current && !editing) scrollToBottom();
  }, [messages, editing, scrollToBottom]);

  // fecha o menu ao clicar fora, rolar ou redimensionar (o menu é posicionado por rect)
  useEffect(() => {
    if (menuFor == null) return undefined;
    const close = () => setMenuFor(null);
    window.addEventListener('click', close);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
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
      // o broadcast STOMP pode chegar antes desta resposta — dedupe por id
      setMessages((prev) => {
        const list = prev || [];
        return list.some((m) => m.id === saved.id) ? list : [...list, saved];
      });
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

  const rows = useMemo(() => withUnread(buildRows(messages || []), unreadAnchor), [messages, unreadAnchor]);

  // "Visto": id da minha última mensagem que o outro já leu (só DM)
  const seenMsgId = useMemo(() => {
    if (isGroup || peerReadId == null || !messages) return null;
    let lastMine = null;
    for (const m of messages) {
      if (m.mine && m.kind === 'USER' && !m.deleted) lastMine = m.id;
    }
    return lastMine != null && peerReadId >= lastMine ? lastMine : null;
  }, [isGroup, peerReadId, messages]);

  // Presença do outro (só DM)
  const presence = useMemo(() => {
    if (isGroup) return null;
    const ls = conversation.peerLastSeenAt;
    if (!ls) return null;
    const diff = Date.now() - new Date(ls).getTime();
    return diff < 90_000 ? tc.online : tc.lastSeen.replace('{t}', relativeTime(ls, lang));
  }, [isGroup, conversation.peerLastSeenAt, tc, lang]);

  const activeTypers = typers.filter((tp) => tp.id !== myId);
  let typingLabel = null;
  if (activeTypers.length === 1) {
    typingLabel = isGroup
      ? tc.typingOne.replace('{name}', activeTypers[0].name || '—')
      : tc.typingDm;
  } else if (activeTypers.length === 2) {
    typingLabel = tc.typingTwo
      .replace('{a}', activeTypers[0].name || '—')
      .replace('{b}', activeTypers[1].name || '—');
  } else if (activeTypers.length > 2) {
    typingLabel = tc.typingMany;
  }

  const maybeSendTyping = (value) => {
    if (editing || !value.trim()) return;
    const now = Date.now();
    if (now - typingSentRef.current > 2500) {
      typingSentRef.current = now;
      sendTyping(conversation.id);
    }
  };

  const openDetails = () => {
    if (isGroup) setShowPanel(true);
    else if (conversation.peer?.id) onOpenProfile?.(conversation.peer.id);
  };

  return (
    <div className="chat-thread">
      <div className="chat-thread-head">
        <button type="button" className="chat-back" onClick={onBack} aria-label={tc.back}>
          ←
        </button>
        <button
          type="button"
          className="chat-thread-idbtn"
          onClick={openDetails}
          aria-label={isGroup ? tc.manage : tc.viewProfile}
        >
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
            {isGroup ? (
              <span className="chat-thread-sub">
                {tc.memberCount.replace('{n}', conversation.memberCount)}
                {conversation.pendingRequests > 0 && canModerate && (
                  <span className="chat-pending-dot"> · {tc.pendingN.replace('{n}', conversation.pendingRequests)}</span>
                )}
              </span>
            ) : (
              (typingLabel || presence) && (
                <span className={`chat-thread-sub chat-presence ${typingLabel ? 'is-typing' : ''}`}>
                  {typingLabel || presence}
                </span>
              )
            )}
          </div>
        </button>

        <button
          type="button"
          className="chat-info-btn"
          onClick={openDetails}
          aria-label={isGroup ? tc.manage : tc.viewProfile}
          title={isGroup ? tc.manage : tc.viewProfile}
        >
          <InfoIcon />
        </button>
      </div>

      <div className="chat-messages" ref={listRef} onScroll={onListScroll}>
        {messages !== null && !hasMore && (
          <ThreadIntro conversation={conversation} isGroup={isGroup} tc={tc} onOpenDetails={openDetails} />
        )}
        {messages !== null && rows.length > 0 && hasMore && (
          <button
            type="button"
            className="chat-load-more"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? tc.loadingMore : tc.loadMore}
          </button>
        )}
        {messages === null ? (
          <div className="chat-hint">{tc.loading}</div>
        ) : rows.length === 0 ? (
          <div className="chat-hint">{tc.threadEmpty}</div>
        ) : (
          rows.map((row) => {
            if (row.type === 'time') {
              return (
                <div key={row.id} className="chat-time-sep">
                  {timeSepLabel(row.iso, locale, tc)}
                </div>
              );
            }
            if (row.type === 'system') {
              return <SystemRun key={row.id} items={row.items} tc={tc} />;
            }
            if (row.type === 'unread') {
              return (
                <div key={row.id} className="chat-unread-sep">
                  <span>{tc.unreadDivider}</span>
                </div>
              );
            }
            const { m, showHeader, showTail } = row;
            return (
              <MessageRow
                key={m.id}
                m={m}
                showHeader={showHeader}
                showTail={showTail}
                isGroup={isGroup}
                locale={locale}
                tc={tc}
                canModerate={canModerate}
                seen={seenMsgId === m.id ? tc.seen : null}
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
            );
          })
        )}
        {isGroup && typingLabel && <div className="chat-typing">{typingLabel}</div>}
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
        <EmojiPicker
          onPick={(emoji) => {
            setDraft((d) => d + emoji);
            inputRef.current?.focus();
          }}
          label={tc.emoji}
        />
        <textarea
          ref={inputRef}
          className="chat-input"
          rows={1}
          value={draft}
          maxLength={BODY_MAX}
          placeholder={editing ? tc.editPlaceholder : tc.placeholder}
          onChange={(e) => {
            setDraft(e.target.value);
            maybeSendTyping(e.target.value);
          }}
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
        {(canSend || editing) && (
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!canSend}
            aria-label={editing ? tc.save : tc.send}
          >
            {editing ? '✓' : <SendIcon />}
          </button>
        )}
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

const MENU_W = 244;

/** Cabeçalho de contexto no topo da conversa (aparece quando não há mais histórico acima). */
function ThreadIntro({ conversation, isGroup, tc, onOpenDetails }) {
  return (
    <div className="chat-intro">
      {isGroup ? (
        <GroupIcon
          name={conversation.name}
          imageUrl={conversation.imageUrl}
          className="chat-intro-avatar"
        />
      ) : (
        <Avatar
          user={{
            id: conversation.peer?.id,
            username: conversation.peer?.username,
            avatarUrl: conversation.peer?.avatarUrl,
          }}
          className="chat-intro-avatar"
        />
      )}
      <div className="chat-intro-name">
        {isGroup ? conversation.name : `@${conversation.peer?.username ?? '—'}`}
      </div>
      <div className="chat-intro-meta">
        {isGroup ? tc.memberCount.replace('{n}', conversation.memberCount) : tc.dmIntro}
      </div>
      {isGroup && conversation.description && (
        <div className="chat-intro-desc">{conversation.description}</div>
      )}
      <button type="button" className="chat-intro-btn" onClick={onOpenDetails}>
        {isGroup ? tc.manage : tc.viewProfile}
      </button>
    </div>
  );
}

/** Bloco de avisos do sistema. Runs longas colapsam (primeiro + "+N" + último). */
function SystemRun({ items, tc }) {
  const [open, setOpen] = useState(false);
  const anchorId = `msg-${items[0].id}`;

  if (items.length <= 3 || open) {
    return (
      <div className="chat-system-run" id={anchorId}>
        {items.map((it) => (
          <div key={it.id} className="chat-system">{it.body}</div>
        ))}
        {items.length > 3 && (
          <button type="button" className="chat-system-toggle" onClick={() => setOpen(false)}>
            {tc.showLess}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="chat-system-run" id={anchorId}>
      <div className="chat-system">{items[0].body}</div>
      <button type="button" className="chat-system-toggle" onClick={() => setOpen(true)}>
        {tc.moreEvents.replace('{n}', items.length - 2)}
      </button>
      <div className="chat-system">{items[items.length - 1].body}</div>
    </div>
  );
}

function MessageRow({
  m, showHeader, showTail, isGroup, locale, tc, canModerate, seen,
  menuOpen, onOpenMenu, onReact, onReply, onEdit, onDelete, onJump,
}) {
  const showAvatar = !m.mine;
  const canEdit = m.mine && !m.deleted;
  const canDelete = (m.mine || canModerate) && !m.deleted;

  // Menu de ações: portal com posição fixa (não é cortado pelo overflow:hidden).
  const toolbarRef = useRef(null);
  const [menuPos, setMenuPos] = useState(null);
  useLayoutEffect(() => {
    if (!menuOpen || !toolbarRef.current) {
      setMenuPos(null);
      return;
    }
    const r = toolbarRef.current.getBoundingClientRect();
    const gap = 6;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - MENU_W - 8));
    const openUp = r.top > 220;
    setMenuPos({
      left,
      top: openUp ? r.top - gap : r.bottom + gap,
      transform: openUp ? 'translateY(-100%)' : 'none',
    });
  }, [menuOpen]);

  const title = new Date(m.createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div
      id={`msg-${m.id}`}
      className={[
        'chat-bubble-row',
        m.mine ? 'is-mine' : '',
        showHeader ? '' : 'is-cont',
        showTail ? 'is-tail' : '',
      ].join(' ')}
    >
      {showAvatar && (
        <div className="chat-row-avatar">
          {showTail ? (
            <Avatar
              user={{ id: m.senderId, username: m.senderName, avatarUrl: m.senderAvatarUrl }}
              className="chat-msg-avatar"
            />
          ) : null}
        </div>
      )}

      <div className="chat-bubble-wrap">
        {isGroup && showAvatar && showHeader && (
          <span className="chat-bubble-sender">{m.senderName || '—'}</span>
        )}

        <div className="chat-bubble" title={title}>
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
          {m.edited && !m.deleted && <span className="chat-edited-tag">{tc.editedTag}</span>}
        </div>

        {!m.deleted && (
          <div className="chat-msg-toolbar" ref={toolbarRef}>
            <button type="button" className="chat-msg-tbtn" onClick={onOpenMenu} aria-label={tc.react}>
              🙂
            </button>
            <button type="button" className="chat-msg-tbtn" onClick={onReply} aria-label={tc.reply}>
              ↩
            </button>
            <button type="button" className="chat-msg-tbtn" onClick={onOpenMenu} aria-label={tc.messageActions}>
              ⋯
            </button>
          </div>
        )}

        {menuOpen && menuPos &&
          createPortal(
            <div
              className="chat-msg-menu"
              style={{
                position: 'fixed',
                left: menuPos.left,
                top: menuPos.top,
                transform: menuPos.transform,
                width: MENU_W,
              }}
              onClick={(e) => e.stopPropagation()}
            >
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
            </div>,
            document.body,
          )}

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

        {seen && <span className="chat-seen">{seen}</span>}
      </div>
    </div>
  );
}
