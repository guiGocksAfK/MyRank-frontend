import SocialAvatar from './SocialAvatar';
import ReactionBar from './ReactionBar';
import { typeIconFor } from './socialData';
import { useLanguage } from '../../shared/i18n';
import { relativeTime } from '../../shared/useUnifiedItems';

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

export default function ActivityCard({ item, onReact, onOpenUser }) {
  const { lang } = useLanguage();
  const openUser = () => onOpenUser?.(item.actor.id);

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
        </div>

        <div className="social-card-body">
          <Body item={item} />
        </div>

        <div className="social-card-actions">
          <ReactionBar reactions={item.reactions} onReact={(kind) => onReact(item.id, kind)} />
        </div>
      </div>
    </article>
  );
}
