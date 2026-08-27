import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithDiscord } from "../../services/authService";
import "./auth.css";

export default function DiscordCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    const accessToken = hashParams.get("access_token");
    const oauthError = hashParams.get("error") || queryParams.get("error");
    const errorDescription = hashParams.get("error_description") || queryParams.get("error_description");

    if (oauthError) {
      setError(errorDescription || "Autorização cancelada ou negada.");
      return;
    }

    if (!accessToken) {
      setError("Token do Discord não encontrado. Verifique se a redirect URI cadastrada no Discord bate exatamente com a URL atual.");
      return;
    }

    loginWithDiscord(accessToken)
      .then(() => navigate("/dashboard"))
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
