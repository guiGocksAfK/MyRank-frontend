import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n';

/**
 * Diálogo de confirmação padrão do site (usado em rankings, takes, grupos…).
 * `onConfirm` pode ser async; se resolver com valor truthy, o modal fecha sozinho.
 */
export default function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose }) {
  const { t } = useLanguage();
  const tc = t.rankings.confirm;
  const label = confirmLabel || tc.deleteDefault;
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !confirming) onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [confirming, onClose]);

  async function handleConfirm() {
    setConfirming(true);
    const confirmed = await onConfirm();
    if (confirmed) onClose();
    setConfirming(false);
  }

  return createPortal(
    <div
      role="presentation"
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0, 0, 0, 0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={() => !confirming && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mr-confirm-title"
        style={{
          width: 390, maxWidth: '100%', padding: '1.5rem',
          background: 'var(--mr-surface)', border: '1px solid var(--mr-border)',
          borderRadius: 12, boxShadow: '0 18px 50px rgba(0, 0, 0, 0.5)',
        }}
        onClick={event => event.stopPropagation()}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>⚠️</div>
          <div>
            <h2 id="mr-confirm-title" style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8 }}>
              {title}
            </h2>
            <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        </div>

        <div className="mr-actions" style={{ marginTop: '1.5rem' }}>
          <button type="button" className="mr-btn mr-btn-ghost" onClick={onClose} disabled={confirming}>
            {tc.cancel}
          </button>
          <button type="button" className="mr-btn mr-btn-danger" onClick={handleConfirm} disabled={confirming}>
            {confirming ? tc.deleting : label}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
