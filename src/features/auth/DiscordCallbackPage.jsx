import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { consumeDiscordState, loginWithDiscord, takePostAuthPath } from "../../services/authService";
import "./auth.css";

export default function DiscordCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  // O token e o state só valem uma vez; sem isso o StrictMode (dev) rodaria duas.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    const accessToken = hashParams.get("access_token");
    const returnedState = hashParams.get("state") || queryParams.get("state");
    const oauthError = hashParams.get("error") || queryParams.get("error");
    const errorDescription = hashParams.get("error_description") || queryParams.get("error_description");

    // Tira o token do Discord da barra de endereço (e do histórico do navegador).
    window.history.replaceState(null, "", window.location.pathname);

    if (oauthError) {
      setError(errorDescription || "Autorização cancelada ou negada.");
      return;
    }

    if (!accessToken) {
      setError("Token do Discord não encontrado. Verifique se a redirect URI cadastrada no Discord bate exatamente com a URL atual.");
      return;
    }

    // Login que não foi iniciado por esta aba (link forjado) é descartado.
    if (!consumeDiscordState(returnedState)) {
      setError("Não foi possível confirmar que este login começou aqui. Tente entrar com o Discord de novo.");
      return;
    }

    loginWithDiscord(accessToken)
      .then(() => navigate(takePostAuthPath()))
      .catch((err) => {
        setError(err.response?.data?.message || "Erro ao entrar com Discord.");
      });
  }, [navigate]);

  return (
    <main className="auth-page auth-page--noscroll">
      <section className="auth-card" style={{ margin: "auto" }}>
        {error ? (
          <>
            <p className="auth-error">{error}</p>
            <button className="auth-submit" type="button" onClick={() => navigate("/entrar")}>
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
