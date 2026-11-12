import { useState } from 'react';
import { deleteMe, requestDeletionCode } from '../../services/userService';
import { logout } from '../../services/authService';
import { useLanguage } from '../../shared/i18n';
import Modal from '../../shared/components/Modal';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

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
    event?.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      await deleteMe({
        confirmUsername: confirmUsername.trim(),
        deletionCode: deletionCode.trim(),
      });
      await logout();
      // Recarrega do zero: derruba o chat em tempo real e qualquer estado da sessão antiga.
      window.location.replace('/');
    } catch (err) {
      setError(err?.response?.data?.message || tp.deleteError);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={tp.deleteTitle}
      onClose={onClose}
      busy={busy}
      closeOnBackdrop={false}
      footer={(
        <>
          {error && <p className="pf-form-error" role="alert">{error}</p>}
          <button className="mr-btn mr-btn-ghost" type="button" onClick={onClose} disabled={busy}>{tp.cancel}</button>
          <button className="mr-btn mr-btn-danger" type="button" onClick={handleDelete} disabled={busy || !canSubmit}>
            {busy ? tp.deleting : tp.deleteConfirmBtn}
          </button>
        </>
      )}
    >
      <form className="pf-delete" onSubmit={handleDelete}>
        <p className="pf-delete-warn">{tp.deleteWarn}</p>

        <label className="pf-field">
          <span className="mr-field-label pf-label-plain">{fmt(tp.deleteConfirmLabel, { username: user.username })}</span>
          <input className="mr-input" value={confirmUsername} onChange={(e) => setConfirmUsername(e.target.value)}
            autoComplete="off" autoFocus />
        </label>

        <div className="pf-field">
          <button className="mr-btn mr-btn-sm mr-btn-outline" type="button" onClick={handleRequestCode} disabled={busy}>
            {codeSent ? tp.deleteResendCode : tp.deleteSendCode}
          </button>
          {codeSent && <p className="mr-field-hint">{tp.deleteCodeSent}</p>}
        </div>

        <label className="pf-field">
          <span className="mr-field-label">{tp.deleteCodeLabel}</span>
          <input className="mr-input" value={deletionCode} onChange={(e) => setDeletionCode(e.target.value.toUpperCase())}
            autoComplete="one-time-code" maxLength={8} />
        </label>
        {/* Enter no campo envia; o botão de verdade fica no rodapé do modal */}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
