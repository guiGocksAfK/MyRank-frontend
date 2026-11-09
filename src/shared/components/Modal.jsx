import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLanguage } from '../i18n';
import useModalBehavior from './useModalBehavior';

/**
 * Moldura padrão de modal: título + ×, corpo com rolagem e rodapé com os botões.
 * Esc e clique fora fecham, a não ser durante `busy` (salvando, criando…).
 * Formulário longo passa `closeOnBackdrop={false}`: um clique fora sem querer
 * apagava tudo que foi digitado.
 */
export default function Modal({ title, onClose, footer, children, width = 440, busy = false, closeOnBackdrop = true }) {
  const { t } = useLanguage();
  const titleId = useId();

  const dialog = useRef(null);
  useModalBehavior(dialog, () => { if (!busy) onClose(); });

  return createPortal(
    <div className="mr-dialog-backdrop" role="presentation" onClick={() => !busy && closeOnBackdrop && onClose()}>
      <div
        ref={dialog}
        tabIndex={-1}
        className="mr-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ '--mr-dialog-width': `${width}px` }}
        onClick={event => event.stopPropagation()}
      >
        <div className="mr-dialog-head">
          <h2 id={titleId} className="mr-dialog-title">{title}</h2>
          <button type="button" className="mr-dialog-close" onClick={onClose} disabled={busy} aria-label={t.common.close}>
            <X size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        <div className="mr-dialog-body">{children}</div>
        {footer && <div className="mr-dialog-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
