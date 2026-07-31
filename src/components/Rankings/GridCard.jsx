import React from 'react';
import { getNoteBarColor, formatTime } from '../../utils/formatters';

export default function GridCard({ item, mode, maxNote, index, onEdit, onDelete, showActions }) {
  const displayNote = mode === 'weight' ? item.finalNote : item.note;
  const bonus = mode === 'weight' ? item.bonusTime : 0;
  const barWidth = Math.min((displayNote / maxNote) * 100, 100);

  return (
    <div style={{
      position: 'relative', borderRadius: 8, overflow: 'hidden',
      border: index < 3 ? '2px solid var(--mr-gold)' : '1px solid var(--mr-border)',
      background: 'var(--mr-surface)', cursor: showActions ? 'pointer' : 'default',
      transition: 'transform 0.15s ease',
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ position: 'relative', aspectRatio: '2 / 3', background: 'var(--mr-bg)' }}>
        {item.image ? (
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
          }}>🎬</div>
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
          {displayNote.toFixed(1)}
        </div>
      </div>

      <div style={{ padding: '8px 10px' }}>
        <div className="mr-truncate" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>
          {item.title}
        </div>
        <div className="mr-truncate" style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginBottom: 6 }}>
          {item.sub}
        </div>

        <div className="mr-note-bar" style={{ height: 4 }}>
          <div className={`mr-note-bar-fill ${getNoteBarColor(displayNote)}`} style={{ width: `${barWidth}%` }} />
        </div>

        {mode === 'weight' && (
          <div style={{ fontSize: '0.7rem', color: 'var(--mr-blue-light)', marginTop: 4 }}>
            +{bonus.toFixed(1)} bônus
          </div>
        )}
        {mode === 'time' && (
          <div style={{ fontSize: '0.7rem', color: 'var(--mr-blue-light)', marginTop: 4 }}>
            {formatTime(item.timeMinutes)}
          </div>
        )}

        {showActions && (
          <div className="mr-flex mr-gap-1 mr-mt-2" style={{ justifyContent: 'flex-end' }}>
            <button
              title="Editar"
              onClick={(e) => { e.stopPropagation(); onEdit?.(item); }}
              style={{
                width: 24, height: 24, borderRadius: 4,
                border: '1px solid var(--mr-border)', background: 'transparent',
                cursor: 'pointer', fontSize: '0.7rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--mr-text-secondary)',
              }}
            >✏️</button>
            <button
              title="Excluir"
              onClick={(e) => { e.stopPropagation(); onDelete?.(item.id); }}
              style={{
                width: 24, height: 24, borderRadius: 4,
                border: '1px solid var(--mr-border)', background: 'transparent',
                cursor: 'pointer', fontSize: '0.7rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--mr-text-secondary)',
              }}
            >🗑️</button>
          </div>
        )}
      </div>
    </div>
  );
}