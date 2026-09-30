import { useState } from "react";
import { useLanguage } from "../../shared/i18n";

/**
 * Os dois olhos vivem no mesmo desenho: o aberto (pupila dourada) "estica" de
 * uma linha até o olho inteiro enquanto o fechado (com cílios) some. Como nada
 * é trocado, a transição é contínua nos dois sentidos.
 */
const Eye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <g className="auth-eye-open">
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
      <circle className="auth-eye-pupil" cx="12" cy="12" r="3" stroke="none" />
    </g>
    <g className="auth-eye-closed">
      <path d="M3 10c2.5 3.5 5.6 5 9 5s6.5-1.5 9-5" />
      <path d="M5.6 13.4 4.2 15.4M12 15v2.6M18.4 13.4l1.4 2" />
    </g>
  </svg>
);

/** Campo de senha com um olho que abre e fecha pra mostrar/ocultar o que foi digitado. */
const PasswordInput = (props) => {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();
  const label = visible ? t.auth.hidePassword : t.auth.showPassword;

  return (
    <span className="auth-password">
      <input {...props} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="auth-password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
      >
        <Eye />
      </button>
    </span>
  );
};

export default PasswordInput;
