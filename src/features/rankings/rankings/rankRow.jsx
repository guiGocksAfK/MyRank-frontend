import { ChevronDown, ChevronUp } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';
import { formatTime } from '../../../utils/formatters';
import { rowColumns } from './rankColumns';

/**
 * Peças da linha do ranking, iguais no Unificado e na tabela individual: colunas,
 * cabeçalho, células de nota e as setinhas do modo "Reordenar" (celular).
 */

export function RankHeader({ mode, labels, unified = false, actions = false, reordering = false }) {
  const headers = [labels.rank, '', labels.title];
  if (unified) headers.push(labels.table);
  if (mode === 'weight') headers.push(labels.score, labels.bonus, labels.finalScore);
  else if (mode === 'time') headers.push(labels.score, labels.time);
  else headers.push(labels.score);
  if (reordering) headers.push('');
  if (actions) headers.push('');
  return (
    <div className="rk-header" style={{ '--rk-cols': rowColumns(mode, { unified, actions, reordering }) }}>
      {headers.map((h, i) => <span key={i}>{h}</span>)}
    </div>
  );
}

/** Nota(s) da obra. No celular só fica a nota que ordena (final, ou o tempo). */
export function ScoreCells({ item, mode, locale }) {
  if (mode === 'weight') {
    return (
      <>
        <span className="rk-cell rk-hide-mobile"><AnimatedNumber value={item.note} locale={locale} /></span>
        <span className="rk-cell rk-hide-mobile">
          {item.bonusTime > 0 ? <AnimatedNumber value={item.bonusTime} prefix="+" locale={locale} /> : '—'}
        </span>
        <span className="rk-score"><AnimatedNumber value={item.finalNote} locale={locale} /></span>
      </>
    );
  }
  if (mode === 'time') {
    return (
      <>
        <span className="rk-cell rk-hide-mobile"><AnimatedNumber value={item.note} locale={locale} /></span>
        <span className="rk-score rk-score-time">{formatTime(item.timeMinutes)}</span>
      </>
    );
  }
  return <span className="rk-score"><AnimatedNumber value={item.note} locale={locale} /></span>;
}

/** Sobe/desce a obra trocando com a vizinha de mesma nota (no celular não tem arrastar). */
export function ReorderButtons({ canUp, canDown, onUp, onDown, labels }) {
  return (
    <div className="rk-reorder">
      <button type="button" aria-label={labels.moveUp} onClick={onUp} disabled={!canUp}>
        <ChevronUp size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <button type="button" aria-label={labels.moveDown} onClick={onDown} disabled={!canDown}>
        <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </div>
  );
}
