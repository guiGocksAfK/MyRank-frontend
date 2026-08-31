import { useEffect, useRef, useState } from 'react';
import SocialAvatar from './SocialAvatar';
import { socialApi } from './socialData';
import { useLanguage } from '../../shared/i18n';
import { relativeTime } from '../../shared/useUnifiedItems';

const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a1 1 0 00-1.4 1.15L4 11l10 1-10 1-2 6.25a1 1 0 001.4 1.15z" />
  </svg>
);

/** Comentários de um take (2 níveis, estilo Instagram). Vive dentro do ActivityCard. */
export default function TakeComments({ takeId, onOpenUser, onCountChange }) {
  const { t, lang } = useLanguage();
  const tc = t.social.comments;
  const [comments, setComments] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // id do comentário raiz sendo respondido
  const inputRef = useRef(null);

  useEffect(() => {
    socialApi.getTakeComments(takeId).then(setComments).catch(() => setComments([]));
  }, [takeId]);

  async function submit(e) {
    e?.preventDefault?.();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const c = await socialApi.addTakeComment(takeId, body, replyTo);
      setComments((prev) => {
        const list = prev || [];
        if (!replyTo) return [...list, c];
        return list.map((root) =>
          root.id === replyTo ? { ...root, replies: [...root.replies, c] } : root,
        );
      });
      setText('');
      setReplyTo(null);
      onCountChange?.(1);
    } catch {
      /* silencioso */
    } finally {
      setBusy(false);
    }
  }

  async function remove(id, rootId) {
    let removed = 1;
    setComments((prev) => {
      const list = prev || [];
      if (rootId == null) {
        const target = list.find((r) => r.id === id);
        removed = 1 + (target?.replies.length || 0);
        return list.filter((r) => r.id !== id);
      }
      return list.map((r) =>
        r.id === rootId ? { ...r, replies: r.replies.filter((x) => x.id !== id) } : r,
      );
    });
    try {
      await socialApi.deleteTakeComment(id);
      onCountChange?.(-removed);
    } catch {
      socialApi.getTakeComments(takeId).then(setComments).catch(() => {});
    }
  }

  async function edit(id, rootId, newText) {
    const updated = await socialApi.editTakeComment(id, newText);
    const patch = { text: updated.text, edited: true };
    setComments((prev) => {
      const list = prev || [];
      if (rootId == null) {
        return list.map((r) => (r.id === id ? { ...r, ...patch } : r));
      }
      return list.map((r) =>
        r.id === rootId
          ? { ...r, replies: r.replies.map((x) => (x.id === id ? { ...x, ...patch } : x)) }
          : r,
      );
    });
  }

  function startReply(rootId, handle) {
    setReplyTo(rootId);
    setText((cur) => (cur ? cur : `@${handle} `));
    inputRef.current?.focus();
  }

  return (
    <div className="social-comments">
      {comments === null ? (
        <div className="social-comments-hint">{tc.loading}</div>
      ) : comments.length === 0 ? (
        <div className="social-comments-hint">{tc.empty}</div>
      ) : (
        <ul className="social-comment-list">
          {comments.map((c) => (
            <CommentNode
              key={c.id}
              c={c}
              lang={lang}
              tc={tc}
              onOpenUser={onOpenUser}
              onReply={() => startReply(c.id, c.author?.handle || '')}
              onDelete={() => remove(c.id, null)}
              onEdit={(txt) => edit(c.id, null, txt)}
              onDeleteReply={(rid) => remove(rid, c.id)}
              onEditReply={(rid, txt) => edit(rid, c.id, txt)}
            />
          ))}
        </ul>
      )}

      <form className="social-comment-form" onSubmit={submit}>
        {replyTo && (
          <button
            type="button"
            className="social-comment-replybadge"
            onClick={() => { setReplyTo(null); setText(''); }}
          >
            {tc.replyingTo} ✕
          </button>
        )}
        <input
          ref={inputRef}
          className="social-comment-input"
          value={text}
          maxLength={500}
          placeholder={tc.placeholder}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className="mr-btn mr-btn-gold mr-btn-sm social-comment-send"
          disabled={busy || !text.trim()}
          aria-label={tc.send}
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}

function CommentNode({
  c, lang, tc, onOpenUser, onReply, onDelete, onEdit, onDeleteReply, onEditReply,
}) {
  const [showReplies, setShowReplies] = useState(false);
  return (
    <li className="social-comment">
      <CommentRow
        c={c}
        lang={lang}
        tc={tc}
        onOpenUser={onOpenUser}
        onReply={onReply}
        onDelete={onDelete}
        onEdit={onEdit}
      />
      {c.replies.length > 0 && (
        <>
          <button
            type="button"
            className="social-comment-toggle"
            onClick={() => setShowReplies((v) => !v)}
          >
            {showReplies ? tc.hideReplies : tc.showReplies.replace('{n}', c.replies.length)}
          </button>
          {showReplies && (
            <ul className="social-comment-replies">
              {c.replies.map((r) => (
                <li key={r.id}>
                  <CommentRow
                    c={r}
                    lang={lang}
                    tc={tc}
                    onOpenUser={onOpenUser}
                    onDelete={() => onDeleteReply(r.id)}
                    onEdit={(txt) => onEditReply(r.id, txt)}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  );
}

function CommentRow({ c, lang, tc, onOpenUser, onReply, onDelete, onEdit }) {
  const a = c.author || {};
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.text);
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e?.preventDefault?.();
    const body = draft.trim();
    if (!body || busy) return;
    if (body === c.text) { setEditing(false); return; }
    setBusy(true);
    try {
      await onEdit(body);
      setEditing(false);
    } catch {
      /* silencioso */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="social-comment-row">
      <button type="button" className="social-comment-avatar" onClick={() => onOpenUser?.(a.id)}>
        <SocialAvatar name={a.username} initials={a.initials} color={a.color} src={a.avatarSrc} size={30} />
      </button>
      <div className="social-comment-main">
        <div className="social-comment-meta">
          <button type="button" className="social-link" onClick={() => onOpenUser?.(a.id)}>
            {a.username}
          </button>
          <span className="social-muted">{relativeTime(c.createdAt, lang)}</span>
          {c.edited && <span className="social-muted">{tc.edited}</span>}
        </div>

        {editing ? (
          <form className="social-comment-editform" onSubmit={save}>
            <input
              className="social-comment-input"
              value={draft}
              maxLength={500}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setEditing(false); setDraft(c.text); } }}
            />
            <button type="submit" className="mr-btn mr-btn-gold mr-btn-sm" disabled={busy || !draft.trim()}>
              {tc.save}
            </button>
            <button
              type="button"
              className="mr-btn mr-btn-outline mr-btn-sm"
              onClick={() => { setEditing(false); setDraft(c.text); }}
            >
              {tc.cancel}
            </button>
          </form>
        ) : (
          <div className="social-comment-text">{c.text}</div>
        )}

        {!editing && (
          <div className="social-comment-actions">
            {onReply && <button type="button" onClick={onReply}>{tc.reply}</button>}
            {c.canEdit && <button type="button" onClick={() => { setDraft(c.text); setEditing(true); }}>{tc.edit}</button>}
            {c.canDelete && <button type="button" onClick={onDelete}>{tc.delete}</button>}
          </div>
        )}
      </div>
    </div>
  );
}
