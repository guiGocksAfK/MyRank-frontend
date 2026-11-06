import { useState } from 'react';
import Modal from '../../shared/components/Modal';
import CodeInput from '../auth/CodeInput';
import PasswordInput from '../auth/PasswordInput';
import { forgotPassword, verifyResetCode, resetPassword } from '../../services/authService';
import { useLanguage } from '../../shared/i18n';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

/**
 * Trocar senha: reaproveita o "esqueci a senha". Manda um código pro email da
 * conta, confere e grava a senha nova. Trocar a senha desconecta os outros
 * aparelhos; este continua logado com o token novo.
 */
export default function ChangePasswordModal({ email, onClose, onDone }) {
  const { t } = useLanguage();
  const tp = t.profile;
  const tr = t.auth.reset;
  const [step, setStep] = useState('send'); // send | code | password
  const [code, setCode] = useState('');
  const [pass, setPass] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err?.response?.data?.message || tp.passwordError);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () => run(async () => {
    await forgotPassword(email);
    setStep('code');
  });

  const checkCode = () => run(async () => {
    setPass(await verifyResetCode(email, code));
    setStep('password');
  });

  const save = () => {
    if (password.length < 8) { setError(tr.tooShort); return; }
    if (password !== confirm) { setError(tr.mismatch); return; }
    run(async () => {
      await resetPassword(pass, password);
      onDone();
    });
  };

  const action = step === 'send'
    ? { label: tp.passwordSend, onClick: sendCode, disabled: busy }
    : step === 'code'
      ? { label: tp.passwordCheck, onClick: checkCode, disabled: busy || code.length < 6 }
      : { label: tp.passwordSave, onClick: save, disabled: busy || !password || !confirm };

  return (
    <Modal
      title={tp.changePassword}
      onClose={onClose}
      busy={busy}
      width={420}
      closeOnBackdrop={false}
      footer={(
        <>
          {error && <p className="pf-form-error" role="alert">{error}</p>}
          <button type="button" className="mr-btn mr-btn-ghost" onClick={onClose} disabled={busy}>{tp.cancel}</button>
          <button type="button" className="mr-btn mr-btn-gold" onClick={action.onClick} disabled={action.disabled}>
            {busy ? tp.saving : action.label}
          </button>
        </>
      )}
    >
      {step === 'send' && <p className="pf-modal-copy">{fmt(tp.passwordIntro, { email })}</p>}

      {step === 'code' && (
        <div className="pf-field">
          <p className="pf-modal-copy">{fmt(tp.passwordCodeSent, { email })}</p>
          <CodeInput id="pf-password-code" value={code} onChange={setCode} disabled={busy} autoFocus />
        </div>
      )}

      {step === 'password' && (
        <>
          <p className="pf-modal-copy">{tp.passwordWarn}</p>
          <label className="pf-field">
            <span className="mr-field-label">{tr.newPasswordLabel}</span>
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" autoFocus />
          </label>
          <label className="pf-field">
            <span className="mr-field-label">{tp.passwordConfirm}</span>
            <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </label>
        </>
      )}
    </Modal>
  );
}
