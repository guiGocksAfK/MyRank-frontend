import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import useDismiss from './useDismiss';

const GAP = 8;

/**
 * "?" que explica algo: abre ao passar o mouse ou focar, e no toque (celular)
 * abre e fecha no clique. O balão vai pro <body> (portal) com position: fixed:
 * modal com rolagem ou com animação não corta nem desloca ele; abre pra cima
 * quando embaixo não cabe.
 */
export default function InfoTip({ label, title, children }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState(null);
  const box = useRef(null);
  const button = useRef(null);
  const pop = useRef(null);
  const close = useCallback(() => { setOpen(false); setPinned(false); }, []);
  useDismiss(pinned, close, box, button);

  useLayoutEffect(() => {
    if (!open || !button.current || !pop.current) return;
    const anchor = button.current.getBoundingClientRect();
    const { offsetWidth: width, offsetHeight: height } = pop.current;
    const left = Math.max(GAP, Math.min(anchor.right + 4 - width, window.innerWidth - width - GAP));
    const below = anchor.bottom + GAP;
    const top = below + height > window.innerHeight - GAP ? Math.max(GAP, anchor.top - GAP - height) : below;
    setPos({ left, top });
  }, [open]);

  return (
    <span
      className="mr-infotip"
      ref={box}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { if (!pinned) { setOpen(false); setPos(null); } }}
    >
      <button
        ref={button}
        type="button"
        className="mr-infotip-btn"
        aria-label={label}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => { if (!pinned) { setOpen(false); setPos(null); } }}
        onClick={() => { setPinned(v => !v); setOpen(true); }}
      >
        ?
      </button>
      {open && createPortal(
        <span
          ref={pop}
          className="mr-infotip-pop"
          role="tooltip"
          style={pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden' }}
        >
          {title && <strong className="mr-infotip-title">{title}</strong>}
          {children}
        </span>,
        document.body,
      )}
    </span>
  );
}
