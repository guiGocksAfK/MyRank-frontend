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

        <div className="mr-flex mr-gap-2" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onClose} disabled={confirming}>
            {tc.cancel}
          </button>
          <button
            className="mr-btn mr-btn-sm"
            onClick={handleConfirm}
            disabled={confirming}
            style={{ color: '#ff8d8b', border: '1px solid rgba(226,75,74,0.45)', background: 'rgba(226,75,74,0.12)' }}
          >
            {confirming ? tc.deleting : `🗑️ ${label}`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
