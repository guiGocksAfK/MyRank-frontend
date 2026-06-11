import { Link, useNavigate } from "react-router-dom";
import "./auth.css";

const Login = () => {
  const navigate = useNavigate();

  return (
    <main className="auth-page auth-page--noscroll">

      {/* Botão voltar */}
      <button
        onClick={() => navigate("/")}
        className="auth-back"
      >
        ← Voltar
      </button>

      <section className="auth-hero" aria-label="Entrar no MyRank">
        <div className="auth-copy">
          <p className="auth-kicker">MyRank</p>
          <h1>Entre no MyRank</h1>
          <p>
            Acompanhe suas notas, rankings e listas em um só lugar.
          </p>
          <div className="auth-highlights" aria-hidden="true">
            <span>🎬 Filmes</span>
            <span>🎮 Jogos</span>
            <span>📺 Séries</span>
            <span>📚 Livros</span>
          </div>
        </div>

        <form className="auth-card">
          <div className="auth-card-header">
            <h2>My<span>Rank</span></h2>
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
              />
            </label>

            <label className="auth-field" htmlFor="password">
              <span>Senha</span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>
          </div>

          <a className="auth-forgot" href="#">
            Esqueci minha senha
          </a>

          <button className="auth-submit" type="submit">
            Entrar
          </button>

          <div className="auth-divider">
            <span>ou continue com</span>
          </div>

          {/* Google */}
          <button className="auth-social-button" type="button">
            <span className="google-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path fill="#4285F4" d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.37a4.59 4.59 0 0 1-1.99 3.01v2.5h3.22c1.88-1.73 3-4.28 3-7.5z" />
                <path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.6-2.42l-3.22-2.5c-.89.6-2.03.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.08v2.58A9.97 9.97 0 0 0 12 22z" />
                <path fill="#FBBC05" d="M6.41 13.92A6 6 0 0 1 6.1 12c0-.67.11-1.32.31-1.92V7.5H3.08A9.97 9.97 0 0 0 2 12c0 1.61.38 3.13 1.08 4.5l3.33-2.58z" />
                <path fill="#EA4335" d="M12 5.96c1.47 0 2.78.5 3.82 1.5l2.86-2.86C16.95 2.99 14.7 2 12 2A9.97 9.97 0 0 0 3.08 7.5l3.33 2.58C7.2 7.72 9.4 5.96 12 5.96z" />
              </svg>
            </span>
            Continuar com Google
          </button>

          {/* Discord */}
          <button className="auth-social-button auth-social-button--discord" type="button">
            <span className="discord-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="#fff">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
            </span>
            Continuar com Discord
          </button>

          <p className="auth-signup-note">
            Não possui uma conta?{" "}
            <Link to="/cadastrar">Crie uma</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default Login;