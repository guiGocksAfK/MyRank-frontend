import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { createUser } from "../services/userService";
import { getDiscordAuthUrl, login, loginWithGoogle } from "../services/authService";
import "./auth.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      return;
    }

    navigate("/");
  };

  const handleContinue = () => {
    setError("");

    if (!email.trim()) {
      setError("Informe seu email para continuar.");
      return;
    }

    setStep(2);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      setLoading(true);
      try {
        await loginWithGoogle(tokenResponse.access_token);
        navigate("/dashboard");
      } catch (err) {
        const message = err.response?.data?.message || err.message || "Erro ao entrar com Google.";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      console.error("Erro no login do Google");
      setError("Erro ao entrar com Google. Verifique se o client ID está correto e se a origem http://localhost:5173 foi autorizada no Google Cloud Console.");
    },
  });

  const handleGoogleClick = () => {
    setError("");
    if (!googleClientId) {
      setError("Google OAuth não está configurado.");
      return;
    }
    googleLogin();
  };

  const handleDiscordLogin = () => {
    setError("");

    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
    if (!clientId) {
      setError("Discord OAuth não configurado.");
      return;
    }

    window.location.href = getDiscordAuthUrl();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Informe um nome de usuário.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      await createUser({ username: username.trim(), email: email.trim(), password });
      await login(email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      const message = err.response?.data?.message || "Erro ao criar conta. Tente novamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-page--noscroll">

      <button onClick={handleBack} className="auth-back">
        ← Voltar
      </button>

      <section className="auth-hero" aria-label="Cadastrar no MyRank">
        <div className="auth-copy">
          <p className="auth-kicker">MyRank</p>
          <h1>Crie sua conta</h1>
          <p>
            Monte tabelas, organize seus favoritos e veja tudo em um só painel.
          </p>
          <div className="auth-highlights" aria-hidden="true">
            <span>🎬 Filmes</span>
            <span>🎮 Jogos</span>
            <span>📺 Séries</span>
            <span>📚 Livros</span>
          </div>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-card-header">
            <h2>My<span>Rank</span></h2>
            <p className="auth-step-label">Etapa {step} de 2</p>
          </div>

          {step === 1 ? (
            <div className="auth-step-panel">
              <div className="auth-step-copy">
                <h3>Comece com sua conta</h3>
                <p>Use Google ou Discord, ou continue com email e siga para o próximo passo.</p>
              </div>

              <div className="auth-fields">
                <label className="auth-field" htmlFor="email">
                  <span>Email</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                {error && <p className="auth-error">{error}</p>}

                <button
                  className="auth-submit auth-submit--compact"
                  type="button"
                  onClick={handleContinue}
                  disabled={loading}
                >
                  Continuar
                </button>

                <div className="auth-divider">
                  <span>ou continue com</span>
                </div>

                <button
                  className="auth-social-button auth-social-button--google"
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={loading}
                >
                  <span className="google-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.26v3.11C3.24 21.3 7.28 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11z"/>
                      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.26 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77z"/>
                    </svg>
                  </span>
                  Continuar com Google
                </button>

                <button
                  className="auth-social-button auth-social-button--discord"
                  type="button"
                  onClick={handleDiscordLogin}
                  disabled={loading}
                >
                  <span className="discord-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="#fff">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                    </svg>
                  </span>
                  Continuar com Discord
                </button>
              </div>

              <p className="auth-signup-note">
                Já possui uma conta? <Link to="/entrar">Entre aqui</Link>
              </p>
            </div>
          ) : (
            <div className="auth-step-panel">
              <div className="auth-step-copy">
                <h3>Finalize seu cadastro</h3>
                <p>Defina seu nome de usuário e sua senha para concluir a conta.</p>
              </div>

              <div className="auth-fields">
                <label className="auth-field" htmlFor="username">
                  <span>Nome de usuário</span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="seunome"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="password">
                  <span>Senha</span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="confirm">
                  <span>Confirmar senha</span>
                  <input
                    id="confirm"
                    name="confirm"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </label>
              </div>

              {error && <p className="auth-error">{error}</p>}

              <div className="auth-button-row">
                <button className="auth-secondary-button" type="button" onClick={() => setStep(1)}>
                  Voltar
                </button>
                <button className="auth-submit auth-submit--inline" type="submit" disabled={loading}>
                  {loading ? "Criando..." : "Criar conta"}
                </button>
              </div>
            </div>
          )}
        </form>
      </section>
    </main>
  );
};

export default Register;