import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import SocialAvatar from './SocialAvatar';
import ReactionBar from './ReactionBar';
import TakeComments from './TakeComments';
import { socialApi, typeIconFor } from './socialData';
import { useLanguage } from '../../shared/i18n';
import { relativeTime } from '../../shared/useUnifiedItems';
import ConfirmModal from '../../shared/components/ConfirmModal';
import TakeMenu from './TakeMenu';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

/** Capa da obra; sem capa, ou se o link quebrar, fica o ícone do tipo. */
function Cover({ work, alt = '' }) {
  const [failedSrc, setFailedSrc] = useState(null);
  if (!work.imageUrl || failedSrc === work.imageUrl) return typeIconFor(work.type, 18);
  return <img src={work.imageUrl} alt={alt} loading="lazy" onError={() => setFailedSrc(work.imageUrl)} />;
}

/** Diferença de nota a partir da qual o card avisa que vocês discordam. */
const CLASH_GAP = 2;

/**
 * A obra do take: capa, título, tipo e a nota em dourado; a capa faz o feed ser
 * lido de relance. Se você também avaliou a obra, a sua nota aparece embaixo.
 */
function WorkRow({ work, myScore }) {
  const { t, locale } = useLanguage();
  if (!work?.title) return null;
  const note = (n) => Number(n).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const hasMine = myScore != null && work.score != null;
  const clash = hasMine && Math.abs(Number(work.score) - myScore) >= CLASH_GAP;
  return (
    <div className="social-work">
      <span className="social-work-cover">
        <Cover work={work} />
      </span>
      <span className="social-work-info">
        <span className="social-work-title">{work.title}</span>
        <span className="social-work-type">
          {typeIconFor(work.type, 12)}
          {t.common.mediaTypes[work.type] || work.type}
          {clash && <span className="social-work-clash">{t.social.act.clash}</span>}
        </span>
      </span>
      {work.score != null && (
        <span className="social-work-scores">
          <span className="social-work-score">{note(work.score)}</span>
          {hasMine && (
            <span className="social-work-mine">
              {t.social.act.you} <b>{note(myScore)}</b>
            </span>
          )}
        </span>
      )}
    </div>
  );
}

/**
 * "Avaliou N obras": as capas lado a lado com a nota embaixo, e um "+N" quando
 * o dia teve mais obras do que as capas que vieram.
 */
function RatedDay({ item }) {
  const { locale } = useLanguage();
  const works = item.works || [];
  const more = (item.workCount || works.length) - works.length;
  return (
    <ul className="social-day">
      {works.map((w) => (
        <li key={w.id} className="social-day-work" title={w.title}>
          <span className="social-day-cover">
            <Cover work={w} alt={w.title} />
          </span>
          {w.score != null && (
            <span className="social-day-score">
              {Number(w.score).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
          )}
        </li>
      ))}
      {more > 0 && (
        <li className="social-day-work">
          <span className="social-day-cover is-more">+{more}</span>
        </li>
      )}
    </ul>
  );
}

/**
 * Um card do feed: um take (com reações e comentários) ou as avaliações de uma
 * pessoa num dia, juntas (sem reação: não é um post).
 */
export default function ActivityCard({ item, myScoreOf, onReact, onOpenUser, onEdited, onDeleted }) {
  const { lang, t } = useLanguage();
  const tt = t.social.take;
  const verbs = t.social.act.verbs;
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
  const isDay = item.type === 'RATED_DAY';
  // só o card agrupado leva verbo ("avaliou 5 obras"): quase tudo é take, e repetir
  // "escreveu um take" em todo card era ruído
  const verb = isDay
    ? fmt(item.workCount === 1 ? verbs.RATED_DAY_ONE : verbs.RATED_DAY, { n: item.workCount })
    : null;

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
    <article className="mr-panel social-card">
      <header className="social-card-head">
        <button type="button" className="social-card-avatar" onClick={openUser} aria-label={item.actor.username}>
          <SocialAvatar name={item.actor.username} initials={item.actor.initials} src={item.actor.avatarSrc} size={36} />
        </button>
        <div className="social-card-who">
          <span className="social-card-line">
            <button type="button" className="social-link" onClick={openUser}>{item.actor.username}</button>
            {verb && <span className="social-muted">{verb}</span>}
            <span className="social-card-time">
              · {relativeTime(item.createdAt, lang)}
              {isTake && edited && ` · ${tt.edited}`}
            </span>
          </span>
        </div>
        {canManage && !editing && (
          <TakeMenu
            label={tt.options}
            editLabel={tt.menuEdit}
            deleteLabel={tt.menuDelete}
            onEdit={() => { setDraft(text || ''); setEditing(true); }}
            onDelete={() => setConfirmingDelete(true)}
          />
        )}
      </header>

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
        ) : isDay ? (
          <RatedDay item={item} />
        ) : (
          <>
            {/* a opinião é o conteúdo; a obra vem embaixo, como contexto */}
            <p className="social-take-text">{text?.trim()}</p>
            <WorkRow work={item.work} myScore={myScoreOf?.(item.work)} />
          </>
        )}
      </div>

      {isTake && (
        <div className="social-card-actions">
          <ReactionBar reactions={item.reactions} onReact={(kind) => onReact(item.id, kind)} />
          <button
            type="button"
            className="social-react-btn"
            data-active={showComments ? 'true' : undefined}
            aria-expanded={showComments}
            title={t.social.comments.label}
            onClick={() => setShowComments((v) => !v)}
          >
            <MessageSquare size={15} strokeWidth={1.8} aria-hidden="true" />
            <span className="social-react-label">{t.social.comments.label}</span>
            {commentCount > 0 && <span className="social-react-count">{commentCount}</span>}
          </button>
        </div>
      )}

      {isTake && showComments && (
        <TakeComments
          takeId={item.takeId}
          onOpenUser={onOpenUser}
          onCountChange={(d) => setCommentCount((c) => Math.max(0, c + d))}
        />
      )}

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
