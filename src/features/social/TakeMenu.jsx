import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

/**
 * O "⋯" dos seus takes: abre um menu pequeno com Editar e Excluir. Fecha ao
 * escolher, ao clicar fora ou com Esc.
 */
export default function TakeMenu({ label, editLabel, deleteLabel, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const pick = (fn) => { setOpen(false); fn(); };

  return (
    <div className="social-take-menu" ref={ref}>
      <button
        type="button"
        className="social-icon-btn"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal size={16} strokeWidth={2} aria-hidden="true" />
      </button>
      {open && (
        <div className="social-take-menu-list" role="menu">
          <button type="button" role="menuitem" onClick={() => pick(onEdit)}>
            <Pencil size={14} strokeWidth={1.8} aria-hidden="true" />
            {editLabel}
          </button>
          <button type="button" role="menuitem" className="is-danger" onClick={() => pick(onDelete)}>
            <Trash2 size={14} strokeWidth={1.8} aria-hidden="true" />
            {deleteLabel}
          </button>
        </div>
      )}
    </div>
  );
}
