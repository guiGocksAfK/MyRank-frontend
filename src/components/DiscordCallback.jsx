import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithDiscord } from "../services/authService";
import "./auth.css";

export default function DiscordCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const oauthError = params.get("error");

    if (oauthError) {
      setError("Autorização cancelada ou negada.");
      return;
    }

    if (!accessToken) {
      setError("Token do Discord não encontrado.");
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
