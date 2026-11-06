import { useId } from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * Seção opcional dos modais de tabela (subcategorias, campos próprios): fechada
 * é uma linha só, com o resumo à direita; aberta mostra o editor na mesma caixa.
 */
export default function CollapsibleField({ icon: Icon, title, summary, open, onToggle, children }) {
  const bodyId = useId();
  return (
    <div className={`rk-coll${open ? ' is-open' : ''}`}>
      <button type="button" className="rk-coll-head" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
        {Icon && <Icon className="rk-coll-icon" size={16} strokeWidth={1.8} aria-hidden="true" />}
        <span className="rk-coll-title">{title}</span>
        <span className="rk-coll-summary">{summary}</span>
        <ChevronRight className="rk-coll-chevron" size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>
      {open && <div className="rk-coll-body" id={bodyId}>{children}</div>}
    </div>
  );
}
