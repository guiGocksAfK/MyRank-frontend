import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { consumeDiscordState, loginWithDiscord, takePostAuthPath } from "../../services/authService";
import "./auth.css";

export default function DiscordCallbackPage() {
  const navigate = useNavigate();
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
      fail(errorDescription || "Autorização cancelada ou negada.");
      return;
    }

    if (!code) {
      fail("Código do Discord não encontrado. Verifique se a redirect URI cadastrada no Discord bate exatamente com a URL atual.");
      return;
    }

    // Login que não foi iniciado por esta aba (link forjado) é descartado.
    if (!consumeDiscordState(returnedState)) {
      fail("Não foi possível confirmar que este login começou aqui. Tente entrar com o Discord de novo.");
      return;
    }

    loginWithDiscord(code)
      .then(() => navigate(takePostAuthPath()))
      .catch((err) => {
        setError(err.response?.data?.message || "Erro ao entrar com Discord.");
      });
  }, [navigate]);

  return (
    <main className="auth-page auth-page--noscroll">
      <section className="auth-card mr-panel" style={{ margin: "auto" }}>
        {error ? (
          <>
            <p className="auth-error" role="alert">{error}</p>
            <button className="mr-btn mr-btn-gold auth-submit" type="button" onClick={() => navigate("/entrar")}>
              Voltar para login
            </button>
          </>
        ) : (
          <p>Conectando com Discord...</p>
        )}
      </section>
    </main>
  );
}
