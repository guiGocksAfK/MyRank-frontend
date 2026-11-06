import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

/**
 * Escolha única com a cara do .mr-input, no lugar do <select> nativo (que abre a
 * lista do sistema, fora do visual). O menu vai pro <body> com position: fixed,
 * pra a rolagem do modal não cortar; fecha ao rolar, clicar fora ou Esc (o Esc
 * para aqui e não fecha o modal junto).
 */
export default function SelectMenu({ value, options, onChange, label, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const button = useRef(null);
  const menu = useRef(null);
  const current = options.find(option => option.value === value) ?? options[0];

  useLayoutEffect(() => {
    if (!open || !button.current || !menu.current) return;
    const anchor = button.current.getBoundingClientRect();
    const height = menu.current.offsetHeight;
    const below = anchor.bottom + 6;
    setPos({
      left: anchor.left,
      width: anchor.width,
      top: below + height > window.innerHeight - 8 ? anchor.top - 6 - height : below,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!button.current?.contains(event.target) && !menu.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); button.current?.focus(); }
    };
    const onScroll = (event) => { if (!menu.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        className="mr-input mr-select"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => { setPos(null); setOpen(v => !v); }}
      >
        <span className="mr-select-value">{current?.label}</span>
        <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>
      {open && createPortal(
        <div ref={menu} className="mr-menu mr-select-menu" role="listbox" aria-label={label}
          style={pos ? { left: pos.left, top: pos.top, minWidth: pos.width } : { visibility: 'hidden' }}>
          {options.map(option => (
            <button key={option.value ?? ''} type="button" role="option" aria-selected={option.value === value}
              aria-checked={option.value === value} className="mr-menu-item"
              onClick={() => { onChange(option.value); setOpen(false); button.current?.focus(); }}>
              <span className="mr-menu-radio" aria-hidden="true" />
              {option.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
