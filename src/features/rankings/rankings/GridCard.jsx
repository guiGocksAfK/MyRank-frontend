import { Pencil, Trash2 } from 'lucide-react';
import { formatTime } from '../../../utils/formatters';
import { useLanguage } from '../../../shared/i18n';
import { TEMPLATE_ICONS, hasSquareCover, itemSubline, tableName } from '../../../shared/tableTemplates';
import AnimatedNumber from './AnimatedNumber';

/**
 * Capa do grid, no mesmo desenho do Hall da fama: arte limpa (nada em cima dela) e,
 * embaixo, a posição grande + título + "tabela ou criador · nota". Editar/excluir
 * aparecem no canto da capa só no hover; no toque, a capa inteira abre a edição.
 */
export default function GridCard({ item, customFields = [], mode, index, unified = false, onEdit, onDelete, onClick, showActions, draggable, onDragStart, onDragEnd, onDragOver, onDrop, isDragging }) {
  const { t, locale } = useLanguage();
  const tr = t.rankings;
  const Icon = TEMPLATE_ICONS[item.template] ?? TEMPLATE_ICONS.custom;
  const square = hasSquareCover(item.template);
  const context = unified ? tableName(item._tableLabel) : item.sub?.trim() || itemSubline(item, tr, customFields);

  const value = mode === 'time'
    ? <span className="rk-gcard-value">{formatTime(item.timeMinutes)}</span>
    : <span className="rk-gcard-value"><AnimatedNumber value={mode === 'weight' ? item.finalNote : item.note} locale={locale} /></span>;

  return (
    <div
      className={`rk-gcard mr-rankings-enter${index < 3 ? ' is-top' : ''}${isDragging ? ' is-dragging' : ''}${draggable ? ' is-draggable' : ''}`}
      style={{ '--rank-delay': `${Math.min(index, 12) * 35}ms` }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
    >
      <div className={`rk-gcard-cover${square ? ' is-square' : ''}`}>
        {item.image ? (
          square ? (
            // capa de disco é quadrada: inteira no centro, com ela mesma desfocada de
            // fundo, pra caber no formato dos pôsteres numa tabela mista
            <>
              <img className="rk-gcard-blur" src={item.image} alt="" aria-hidden="true" loading="lazy" />
              <img className="rk-gcard-img is-contain" src={item.image} alt={item.title} loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </>
          ) : (
            <img className="rk-gcard-img" src={item.image} alt={item.title} loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          )
        ) : (
          <span className="rk-gcard-empty"><Icon size={28} strokeWidth={1.4} aria-hidden="true" /></span>
        )}

        {showActions && (
          <div className="rk-gcard-actions">
            <button type="button" title={tr.edit} aria-label={`${tr.edit} ${item.title}`}
              onClick={(e) => { e.stopPropagation(); onEdit?.(item); }}>
              <Pencil size={14} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <button type="button" className="is-danger" title={tr.delete} aria-label={`${tr.delete} ${item.title}`}
              onClick={(e) => { e.stopPropagation(); onDelete?.(item.id); }}>
              <Trash2 size={14} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div className="rk-gcard-info">
        <span className="rk-gcard-rank" aria-hidden="true">{index + 1}</span>
        <div className="rk-gcard-text">
          <div className="rk-gcard-title" title={item.title}>{item.title}</div>
          <div className="rk-gcard-sub">
            {context && <span className="rk-gcard-context">{context}</span>}
            {context && <span aria-hidden="true"> · </span>}
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}
