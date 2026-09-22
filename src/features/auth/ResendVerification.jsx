import { useState } from "react";
import { resendVerification } from "../../services/authService";
import { useLanguage } from "../../shared/i18n";

/** Botão "Reenviar email" do link de confirmação (tela de cadastro e de login). */
export default function ResendVerification({ email }) {
  const { t } = useLanguage();
  const tVerify = t.auth.verify;
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const handleResend = async () => {
    setStatus("sending");
    try {
      await resendVerification(email);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="auth-resend">
      <button
        className="auth-secondary-button"
        type="button"
        onClick={handleResend}
        disabled={status === "sending"}
      >
        {status === "sending" ? tVerify.resending : tVerify.resend}
      </button>
      {status === "sent" && <p className="auth-resend-note">{tVerify.resent}</p>}
      {status === "error" && <p className="auth-error">{tVerify.resendError}</p>}
    </div>
  );
}
