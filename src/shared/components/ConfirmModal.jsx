import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TriangleAlert } from 'lucide-react';
import { useLanguage } from '../i18n';
import useModalBehavior from './useModalBehavior';

/**
 * Diálogo de confirmação padrão do site (usado em rankings, takes, grupos…).
 * `onConfirm` pode ser async; se resolver com valor truthy, o modal fecha sozinho.
 * `busyLabel` troca o "Excluindo…" quando a ação não é uma exclusão.
 */
export default function ConfirmModal({ title, message, confirmLabel, busyLabel, onConfirm, onClose }) {
  const { t } = useLanguage();
  const tc = t.rankings.confirm;
  const label = confirmLabel || tc.deleteDefault;
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const titleId = useId();
  const dialog = useRef(null);
  useModalBehavior(dialog, () => { if (!confirming) onClose(); });

  async function handleConfirm() {
    setConfirming(true);
    setError('');
    try {
      const confirmed = await onConfirm();
      if (confirmed) onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t.chat.actionError);
    } finally {
      setConfirming(false);
    }
  }

  return createPortal(
    <div
      role="presentation"
      className="mr-dialog-backdrop mr-confirm-backdrop"
      onClick={() => !confirming && onClose()}
    >
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="mr-dialog mr-confirm-dialog"
        onClick={event => event.stopPropagation()}
      >
        <div className="mr-confirm-row">
          <TriangleAlert size={22} strokeWidth={1.8} aria-hidden="true" className="mr-confirm-icon" />
          <div>
            <h2 id={titleId} className="mr-confirm-title">
              {title}
            </h2>
            <p className="mr-confirm-msg">
              {message}
            </p>
          </div>
        </div>

        {error && (
          <p className="mr-confirm-error" role="alert">
            {error}
          </p>
        )}

        <div className="mr-actions mr-confirm-actions">
          <button type="button" className="mr-btn mr-btn-ghost" onClick={onClose} disabled={confirming}>
            {tc.cancel}
          </button>
          <button type="button" className="mr-btn mr-btn-danger" onClick={handleConfirm} disabled={confirming}>
            {confirming ? (busyLabel || tc.deleting) : label}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
