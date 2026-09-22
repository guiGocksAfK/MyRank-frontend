import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { takePostAuthPath, verifyEmail } from "../../services/authService";
import { useLanguage } from "../../shared/i18n";
import "./auth.css";

/** Destino do link do email de confirmação: confirma a conta e já entra. */
export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const tVerify = t.auth.verify;
  const token = searchParams.get("token");
  const [failed, setFailed] = useState(!token);
  // O token só vale uma vez: sem isso o StrictMode (dev) chamaria duas vezes e a
  // segunda falharia como "link já usado".
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;

    verifyEmail(token)
      .then(() => navigate(takePostAuthPath(), { replace: true }))
      .catch(() => setFailed(true));
  }, [token, navigate]);

  return (
    <main className="auth-page auth-page--noscroll">
      <section className="auth-card" style={{ margin: "auto" }}>
        <div className="auth-card-header">
          <h2>My<span>Rank</span></h2>
        </div>
        {failed ? (
          <>
            <p className="auth-error">{tVerify.invalid}</p>
            <button className="auth-submit" type="button" onClick={() => navigate("/entrar")}>
              {tVerify.backToLogin}
            </button>
          </>
        ) : (
          <p className="auth-status">{tVerify.confirming}</p>
        )}
      </section>
    </main>
  );
}
