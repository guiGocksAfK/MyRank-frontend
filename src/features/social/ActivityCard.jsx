import SocialAvatar from './SocialAvatar';
import ReactionBar from './ReactionBar';
import { typeIconFor } from './socialData';

function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min atrás`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.round(h / 24);
  return `${d} ${d === 1 ? 'dia' : 'dias'} atrás`;
}

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
  const name = (
    <button className="social-link" onClick={() => onOpenUser?.(item.actor.id)}>
      {item.actor.username}
    </button>
  );

  switch (item.type) {
    case 'RATED':
      return (
        <div className="social-act-line">
          {name} avaliou <strong>{item.work.title}</strong>
          <span className="social-muted"> · {typeIconFor(item.work.type)}</span>
          <ScoreChip value={item.work.score} />
        </div>
      );
    case 'ADDED':
      return (
        <div className="social-act-line">
          {name} adicionou <strong>{item.work.title}</strong> ao ranking
          <span className="social-muted"> · {typeIconFor(item.work.type)}</span>
        </div>
      );
    case 'MOVED_TOP':
      return (
        <div className="social-act-line">
          {name} colocou <strong>{item.work.title}</strong> no{' '}
          <span style={{ color: 'var(--mr-gold)' }}>#1</span>
          <span className="social-muted"> · {typeIconFor(item.work.type)}</span>
        </div>
      );
    case 'BADGE':
      return (
        <div className="social-act-line">
          {name} desbloqueou <span style={{ fontSize: '1.1em' }}>{item.badge.icon}</span>{' '}
          <strong>{item.badge.name}</strong>
        </div>
      );
    case 'WEEKLY':
      return (
        <div className="social-act-line">
          {name} avaliou <strong>{item.summary.count} obras</strong> esta semana
        </div>
      );
    case 'TAKE':
      return (
        <div>
          <div className="social-act-line">
            {name} <span className="social-muted">sobre</span>{' '}
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
          <span className="social-muted">{relTime(item.createdAt)}</span>
        </div>
        <ReactionBar reactions={item.reactions} onReact={(kind) => onReact(item.id, kind)} />
      </div>
    </div>
  );
}
