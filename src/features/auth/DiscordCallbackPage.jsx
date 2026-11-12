import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { consumeDiscordState, loginWithDiscord, takePostAuthPath } from "../../services/authService";
import { useLanguage } from "../../shared/i18n";
import "./auth.css";

export default function DiscordCallbackPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const td = t.auth.discordCallback;
  const [error, setError] = useState("");
  // O código e o state só valem uma vez; sem isso o StrictMode (dev) rodaria duas.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get("code");
    const returnedState = queryParams.get("state");
    const oauthError = queryParams.get("error");
    const errorDescription = queryParams.get("error_description");

    // Tira o código do Discord da barra de endereço (e do histórico do navegador).
    window.history.replaceState(null, "", window.location.pathname);

    const fail = (msg) => Promise.resolve().then(() => setError(msg));

    if (oauthError) {
      fail(errorDescription || td.cancelled);
      return;
    }

    if (!code) {
      fail(td.noCode);
      return;
    }

    // Login que não foi iniciado por esta aba (link forjado) é descartado.
    if (!consumeDiscordState(returnedState)) {
      fail(td.invalidState);
      return;
    }

    loginWithDiscord(code)
      .then(() => navigate(takePostAuthPath()))
      .catch((err) => {
        setError(err.response?.data?.message || td.error);
      });
  }, [navigate, td]);

  return (
    <main className="auth-page auth-page--noscroll">
      <section className="auth-card mr-panel" style={{ margin: "auto" }}>
        {error ? (
          <>
            <p className="auth-error" role="alert">{error}</p>
            <button className="mr-btn mr-btn-gold auth-submit" type="button" onClick={() => navigate("/entrar")}>
              {td.backToLogin}
            </button>
          </>
        ) : (
          <p>{td.connecting}</p>
        )}
      </section>
    </main>
  );
}
