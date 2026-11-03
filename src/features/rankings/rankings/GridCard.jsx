import { Pencil, Trash2 } from 'lucide-react';
import { formatTime } from '../../../utils/formatters';
import { useLanguage } from '../../../shared/i18n';
import { TABLE_TEMPLATES, hasSquareCover, itemSubline } from '../../../shared/tableTemplates';

export default function GridCard({ item, customFields = [], mode, index, onEdit, onDelete, onClick, showActions, draggable, onDragStart, onDragEnd, onDragOver, onDrop, isDragging }) {
  const { t, locale } = useLanguage();
  const tr = t.rankings;
  const displayNote = mode === 'weight' ? item.finalNote : item.note;
  const bonus = mode === 'weight' ? item.bonusTime : 0;
  const formatNote = (n) => Number(n).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <div className="mr-rankings-enter" style={{
      position: 'relative', borderRadius: 8, overflow: 'hidden',
      '--rank-delay': `${Math.min(index, 12) * 35}ms`,
      border: index < 3 ? '1px solid rgba(212, 175, 55, 0.45)' : '1px solid var(--mr-border)',
      background: 'var(--mr-surface)', cursor: draggable ? 'grab' : (showActions ? 'pointer' : 'default'),
      opacity: isDragging ? 0.45 : 1,
      transition: 'transform 0.15s ease, opacity 0.15s ease',
    }}
    draggable={draggable}
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    onDragOver={onDragOver}
    onDrop={onDrop}
    onClick={onClick}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ position: 'relative', aspectRatio: '2 / 3', background: 'var(--mr-bg)', overflow: 'hidden' }}>
        {item.image && hasSquareCover(item.template) ? (
          // Capa de disco é quadrada: inteira no centro, com ela mesma desfocada de fundo,
          // pra caber no mesmo formato dos pôsteres numa tabela mista.
          <>
            <img src={item.image} alt="" aria-hidden="true" loading="lazy"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(18px) brightness(0.55)', transform: 'scale(1.2)' }} />
            <img src={item.image} alt={item.title} loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; }}
              style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain' }} />
          </>
        ) : item.image ? (
          <img
            src={item.image} alt={item.title} loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', color: 'var(--mr-text-secondary)',
          }}>{TABLE_TEMPLATES[item.template]?.emoji ?? '🎬'}</div>
        )}

        <div style={{
          position: 'absolute', top: 6, left: 6,
          background: index < 3 ? 'var(--mr-gold)' : 'rgba(0,0,0,0.7)',
          color: index < 3 ? '#000' : '#fff',
          fontWeight: 700, fontSize: '0.75rem',
          padding: '2px 8px', borderRadius: 12,
        }}>
          #{index + 1}
        </div>

        <div style={{
          position: 'absolute', bottom: 6, right: 6,
          background: 'rgba(0,0,0,0.85)',
          color: 'var(--mr-gold)',
          fontWeight: 700, fontSize: '0.9rem',
          padding: '3px 8px', borderRadius: 6,
        }}>
          {formatNote(displayNote)}
        </div>
      </div>

      <div style={{ padding: '8px 10px' }}>
        <div className="mr-truncate" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>
          {item.title}
        </div>
        <div className="mr-truncate" style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginBottom: 6 }}>
          {itemSubline(item, tr, customFields)}
        </div>

        {mode === 'weight' && (
          <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)' }}>
            {tr.gridBonus.replace('{n}', formatNote(bonus))}
          </div>
        )}
        {mode === 'time' && (
          <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)' }}>
            {formatTime(item.timeMinutes)}
          </div>
        )}

        {showActions && (
          <div className="mr-flex mr-gap-1 mr-mt-2" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="rk-icon-btn" title={tr.edit} aria-label={tr.edit}
              onClick={(e) => { e.stopPropagation(); onEdit?.(item); }}>
              <Pencil size={14} strokeWidth={1.7} aria-hidden="true" />
            </button>
            <button type="button" className="rk-icon-btn is-danger" title={tr.delete} aria-label={tr.delete}
              onClick={(e) => { e.stopPropagation(); onDelete?.(item.id); }}>
              <Trash2 size={14} strokeWidth={1.7} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}