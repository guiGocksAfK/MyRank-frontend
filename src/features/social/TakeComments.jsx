import { useEffect, useRef, useState } from 'react';
import SocialAvatar from './SocialAvatar';
import { socialApi } from './socialData';
import { useLanguage } from '../../shared/i18n';
import { relativeTime } from '../../shared/useUnifiedItems';

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
              onDeleteReply={(rid) => remove(rid, c.id)}
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
        <button type="submit" className="mr-btn mr-btn-gold mr-btn-sm" disabled={busy || !text.trim()}>
          {tc.send}
        </button>
      </form>
    </div>
  );
}

function CommentNode({ c, lang, tc, onOpenUser, onReply, onDelete, onDeleteReply }) {
  const [showReplies, setShowReplies] = useState(false);
  return (
    <li className="social-comment">
      <CommentRow c={c} lang={lang} tc={tc} onOpenUser={onOpenUser} onReply={onReply} onDelete={onDelete} />
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

function CommentRow({ c, lang, tc, onOpenUser, onReply, onDelete }) {
  const a = c.author || {};
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
        </div>
        <div className="social-comment-text">{c.text}</div>
        <div className="social-comment-actions">
          {onReply && <button type="button" onClick={onReply}>{tc.reply}</button>}
          {c.canDelete && <button type="button" onClick={onDelete}>{tc.delete}</button>}
        </div>
      </div>
    </div>
  );
}
