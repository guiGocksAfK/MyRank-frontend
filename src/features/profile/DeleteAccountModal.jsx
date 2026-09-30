import { useEffect, useState } from 'react';
import { deleteMe, requestDeletionCode } from '../../services/userService';
import { logout } from '../../services/authService';
import { useLanguage } from '../../shared/i18n';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
const DANGER = '#ff8d8b';

/**
 * Exclusão definitiva da conta. Pede o username digitado e o código mandado ao
 * email da conta (vale pra todas, com ou sem senha) — o backend confere os dois.
 */
export default function DeleteAccountModal({ user, onClose }) {
  const { t } = useLanguage();
  const tp = t.profile;

  const [confirmUsername, setConfirmUsername] = useState('');
  const [deletionCode, setDeletionCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const canSubmit = confirmUsername.trim() === user.username && deletionCode.trim().length > 0;

  const handleRequestCode = async () => {
    setBusy(true);
    setError('');
    try {
      await requestDeletionCode();
      setCodeSent(true);
    } catch (err) {
      setError(err?.response?.data?.message || tp.deleteCodeError);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      await deleteMe({
        confirmUsername: confirmUsername.trim(),
        deletionCode: deletionCode.trim(),
      });
      logout();
      // Recarrega do zero: derruba o chat em tempo real e qualquer estado da sessão antiga.
      window.location.replace('/');
    } catch (err) {
      setError(err?.response?.data?.message || tp.deleteError);
      setBusy(false);
    }
  };

  return (
    <div
      role="presentation"
      onClick={() => !busy && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 320,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <form
        role="dialog" aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleDelete}
        style={{
          width: 440, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem',
          background: 'var(--mr-surface)', border: '1px solid rgba(226,75,74,0.45)',
          borderRadius: 12, boxShadow: '0 18px 50px rgba(0,0,0,0.5)',
        }}
      >
        <div className="mr-flex mr-items-center mr-justify-between" style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: DANGER }}>{tp.deleteTitle}</h2>
          <button className="mr-btn mr-btn-ghost mr-btn-sm" type="button" onClick={onClose} disabled={busy}>✕</button>
        </div>

        <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--mr-text-secondary)', lineHeight: 1.5 }}>
          {tp.deleteWarn}
        </p>

        <label className="mr-setting-label" style={{ marginBottom: 6, display: 'block' }}>
          {fmt(tp.deleteConfirmLabel, { username: user.username })}
        </label>
        <input
          className="mr-input"
          value={confirmUsername}
          onChange={(e) => setConfirmUsername(e.target.value)}
          autoComplete="off"
          autoFocus
          style={{ width: '100%' }}
        />

        <>
            <button className="mr-btn mr-btn-outline mr-btn-sm" type="button"
              onClick={handleRequestCode} disabled={busy} style={{ marginTop: 12 }}>
              {codeSent ? tp.deleteResendCode : tp.deleteSendCode}
            </button>
            {codeSent && <p style={{ fontSize: '0.8rem', color: 'var(--mr-text-secondary)' }}>
              {tp.deleteCodeSent}
            </p>}
            <label className="mr-setting-label" style={{ margin: '12px 0 6px', display: 'block' }}>
              {tp.deleteCodeLabel}
            </label>
            <input className="mr-input" value={deletionCode}
              onChange={(e) => setDeletionCode(e.target.value.toUpperCase())}
              autoComplete="one-time-code" maxLength={8} style={{ width: '100%' }} />
        </>

        {error && <p className="auth-error" style={{ marginTop: 10 }}>{error}</p>}

        <div className="mr-flex mr-gap-2" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="mr-btn mr-btn-outline mr-btn-sm" type="button" onClick={onClose} disabled={busy}>
            {tp.cancel}
          </button>
          <button
            className="mr-btn mr-btn-sm"
            type="submit"
            disabled={busy || !canSubmit}
            style={{ background: '#e24b4a', color: '#fff', border: '1px solid #e24b4a' }}
          >
            {busy ? tp.deleting : tp.deleteConfirmBtn}
          </button>
        </div>
      </form>
    </div>
  );
}
