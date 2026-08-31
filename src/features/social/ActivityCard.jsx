import { useState } from 'react';
import SocialAvatar from './SocialAvatar';
import ReactionBar from './ReactionBar';
import TakeComments from './TakeComments';
import { socialApi, typeIconFor } from './socialData';
import { useLanguage } from '../../shared/i18n';
import { relativeTime } from '../../shared/useUnifiedItems';
import ConfirmModal from '../../shared/components/ConfirmModal';

function ScoreChip({ value }) {
  if (value == null) return null;
  return <span className="social-score-chip">{Number(value).toFixed(1)}</span>;
}

/** Conteúdo da atividade — verbo primeiro (o nome do autor já está no cabeçalho). */
function Body({ item }) {
  const { t } = useLanguage();
  const a = t.social.act;

  switch (item.type) {
    case 'RATED':
      return (
        <div className="social-act-line">
          {a.rated} <strong>{item.work.title}</strong>
          <span className="social-muted"> · {typeIconFor(item.work.type)}</span>
          <ScoreChip value={item.work.score} />
        </div>
      );
    case 'ADDED':
      return (
        <div className="social-act-line">
          {a.addedPre} <strong>{item.work.title}</strong> {a.addedPost}
          <span className="social-muted"> · {typeIconFor(item.work.type)}</span>
        </div>
      );
    case 'MOVED_TOP':
      return (
        <div className="social-act-line">
          {a.movedPre} <strong>{item.work.title}</strong> {a.movedPost}{' '}
          <span style={{ color: 'var(--mr-gold)', fontWeight: 700 }}>#1</span>
          <span className="social-muted"> · {typeIconFor(item.work.type)}</span>
        </div>
      );
    case 'BADGE':
      return (
        <div className="social-act-line">
          {a.unlocked} <span style={{ fontSize: '1.15em' }}>{item.badge.icon}</span>{' '}
          <strong>{item.badge.name}</strong>
        </div>
      );
    case 'WEEKLY':
      return (
        <div className="social-act-line">
          {a.weeklyPre} <strong>{item.summary.count} {a.worksWord}</strong> {a.weeklyPost}
        </div>
      );
    case 'TAKE':
      return (
        <>
          <div className="social-act-line social-take-ctx">
            <span className="social-muted">{a.about}</span> <strong>{item.work.title}</strong>
            <span className="social-muted"> · {typeIconFor(item.work.type)}</span>
            <ScoreChip value={item.work.score} />
          </div>
          <p className="social-take-text">{item.text}</p>
        </>
      );
    default:
      return null;
  }
}

export default function ActivityCard({ item, onReact, onOpenUser, onEdited, onDeleted }) {
  const { lang, t } = useLanguage();
  const tt = t.social.take;
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(item.commentCount || 0);
  const [text, setText] = useState(item.text);
  const [edited, setEdited] = useState(item.takeEdited);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text || '');
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isTake = item.type === 'TAKE' && item.takeId != null;
  const canManage = isTake && item.canManage;
  const openUser = () => onOpenUser?.(item.actor.id);

  async function saveEdit(e) {
    e?.preventDefault?.();
    const body = draft.trim();
    if (busy) return;
    if (!body || body === text) { setEditing(false); setDraft(text || ''); return; }
    setBusy(true);
    try {
      const updated = await socialApi.editTake(item.takeId, body);
      setText(updated.text);
      setEdited(updated.takeEdited);
      setEditing(false);
      onEdited?.(updated);
    } catch {
      /* silencioso */
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteTake() {
    try {
      await socialApi.deleteTake(item.takeId);
      onDeleted?.(item.id);
      return true;
    } catch {
      return false;
    }
  }

  return (
    <article className={`social-card${item.type === 'TAKE' ? ' is-take' : ''}`}>
      <button type="button" className="social-card-avatar" onClick={openUser} aria-label={item.actor.username}>
        <SocialAvatar
          name={item.actor.username}
          initials={item.actor.initials}
          color={item.actor.color}
          src={item.actor.avatarSrc}
          size={44}
        />
      </button>

      <div className="social-card-content">
        <div className="social-card-head">
          <button type="button" className="social-link" onClick={openUser}>
            {item.actor.username}
          </button>
          <span className="social-muted">@{item.actor.handle}</span>
          <span className="social-muted">·</span>
          <span className="social-muted">{relativeTime(item.createdAt, lang)}</span>
          {isTake && edited && <span className="social-muted">· {tt.edited}</span>}
        </div>

        <div className="social-card-body">
          {editing ? (
            <form className="social-take-editform" onSubmit={saveEdit}>
              <textarea
                className="social-take-editarea"
                value={draft}
                maxLength={280}
                rows={3}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setEditing(false); setDraft(text || ''); } }}
              />
              <div className="social-take-editactions">
                <button type="submit" className="mr-btn mr-btn-gold mr-btn-sm" disabled={busy || !draft.trim()}>
                  {tt.save}
                </button>
                <button
                  type="button"
                  className="mr-btn mr-btn-outline mr-btn-sm"
                  onClick={() => { setEditing(false); setDraft(text || ''); }}
                >
                  {tt.cancel}
                </button>
              </div>
            </form>
          ) : (
            <Body item={{ ...item, text }} />
          )}
        </div>

        <div className="social-card-actions">
          <ReactionBar reactions={item.reactions} onReact={(kind) => onReact(item.id, kind)} />
          {isTake && (
            <button
              type="button"
              className="social-comment-btn"
              data-active={showComments ? 'true' : undefined}
              onClick={() => setShowComments((v) => !v)}
            >
              <span aria-hidden="true">💬</span>
              <span className="social-react-label">{t.social.comments.label}</span>
              {commentCount > 0 && <span className="social-react-count">{commentCount}</span>}
            </button>
          )}
          {canManage && !editing && (
            <div className="social-take-manage">
              <button type="button" onClick={() => { setDraft(text || ''); setEditing(true); }}>
                {tt.edit}
              </button>
              <button type="button" className="is-danger" onClick={() => setConfirmingDelete(true)}>{tt.delete}</button>
            </div>
          )}
        </div>

        {isTake && showComments && (
          <TakeComments
            takeId={item.takeId}
            onOpenUser={onOpenUser}
            onCountChange={(d) => setCommentCount((c) => Math.max(0, c + d))}
          />
        )}
      </div>

      {confirmingDelete && (
        <ConfirmModal
          title={tt.deleteTitle}
          message={tt.confirmDelete}
          confirmLabel={tt.delete}
          onConfirm={confirmDeleteTake}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </article>
  );
}
