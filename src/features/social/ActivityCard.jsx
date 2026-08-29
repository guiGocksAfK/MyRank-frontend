import SocialAvatar from './SocialAvatar';
import ReactionBar from './ReactionBar';
import { typeIconFor } from './socialData';
import { useLanguage } from '../../shared/i18n';
import { relativeTime } from '../../shared/useUnifiedItems';

function ScoreChip({ value }) {
  if (value == null) return null;
  return (
    <span
      style={{
        fontWeight: 700,
        color: 'var(--mr-gold)',
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
      }}
    >
      {Number(value).toFixed(1)}
    </span>
  );
}

/** Corpo do card conforme o tipo da atividade. */
function Body({ item, onOpenUser }) {
  const { t } = useLanguage();
  const a = t.social.act;
  const name = (
    <button className="social-link" onClick={() => onOpenUser?.(item.actor.id)}>
      {item.actor.username}
    </button>
  );

  switch (item.type) {
    case 'RATED':
      return (
        <div className="social-act-line">
          {name} {a.rated} <strong>{item.work.title}</strong>
          <span className="social-muted"> · {typeIconFor(item.work.type)}</span>
          <ScoreChip value={item.work.score} />
        </div>
      );
    case 'ADDED':
      return (
        <div className="social-act-line">
          {name} {a.addedPre} <strong>{item.work.title}</strong> {a.addedPost}
          <span className="social-muted"> · {typeIconFor(item.work.type)}</span>
        </div>
      );
    case 'MOVED_TOP':
      return (
        <div className="social-act-line">
          {name} {a.movedPre} <strong>{item.work.title}</strong> {a.movedPost}{' '}
          <span style={{ color: 'var(--mr-gold)' }}>#1</span>
          <span className="social-muted"> · {typeIconFor(item.work.type)}</span>
        </div>
      );
    case 'BADGE':
      return (
        <div className="social-act-line">
          {name} {a.unlocked} <span style={{ fontSize: '1.1em' }}>{item.badge.icon}</span>{' '}
          <strong>{item.badge.name}</strong>
        </div>
      );
    case 'WEEKLY':
      return (
        <div className="social-act-line">
          {name} {a.weeklyPre} <strong>{item.summary.count} {a.worksWord}</strong> {a.weeklyPost}
        </div>
      );
    case 'TAKE':
      return (
        <div>
          <div className="social-act-line">
            {name} <span className="social-muted">{a.about}</span>{' '}
            <strong>{item.work.title}</strong>
            <span className="social-muted"> · {typeIconFor(item.work.type)}</span>
            <ScoreChip value={item.work.score} />
          </div>
          <p className="social-take-text">{item.text}</p>
        </div>
      );
    default:
      return null;
  }
}

export default function ActivityCard({ item, onReact, onOpenUser }) {
  const { lang } = useLanguage();
  return (
    <div className={`social-card${item.type === 'TAKE' ? ' is-take' : ''}`}>
      <SocialAvatar
        name={item.actor.username}
        initials={item.actor.initials}
        color={item.actor.color}
        src={item.actor.avatarSrc}
        size={38}
      />
      <div className="mr-min-w-0" style={{ flex: 1 }}>
        <Body item={item} onOpenUser={onOpenUser} />
        <div className="social-card-foot">
          <span className="social-muted">@{item.actor.handle}</span>
          <span className="social-muted">·</span>
          <span className="social-muted">{relativeTime(item.createdAt, lang)}</span>
        </div>
        <ReactionBar reactions={item.reactions} onReact={(kind) => onReact(item.id, kind)} />
      </div>
    </div>
  );
}
