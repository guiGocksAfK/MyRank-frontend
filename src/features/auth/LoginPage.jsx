import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, takePostAuthPath } from "../../services/authService";
import { useLanguage } from "../../shared/i18n";
import AuthBackdrop from "./AuthBackdrop";
import PasswordInput from "./PasswordInput";
import SocialButtons from "./SocialButtons";
import "./auth.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const tAuth = t.auth;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate(takePostAuthPath());
    } catch (err) {
      const message = err.response?.data?.message || tAuth.errors.login;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <AuthBackdrop />

      <Link to="/" className="mr-btn mr-btn-outline mr-btn-sm auth-back">
        {tAuth.back}
      </Link>

      <section className="auth-hero" aria-label={tAuth.login.title}>
        <form className="auth-card mr-panel" onSubmit={handleSubmit}>
          <div className="auth-card-header">
            <h2>My<span>Rank</span></h2>
            <p className="auth-tagline">{tAuth.tagline}</p>
          </div>

          <div className="auth-fields">
            <label className="auth-field" htmlFor="email">
              <span>{tAuth.emailLabel}</span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder={tAuth.emailPlaceholder}
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="auth-field" htmlFor="password">
              <span>{tAuth.passwordLabel}</span>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <Link className="auth-forgot" to="/esqueci-senha">
            {tAuth.login.forgot}
          </Link>

          <button className="mr-btn mr-btn-gold auth-submit" type="submit" disabled={loading}>
            {loading ? tAuth.login.submitting : tAuth.login.submit}
          </button>

          <div className="auth-divider">
            <span>{tAuth.orContinue}</span>
          </div>

          <SocialButtons disabled={loading} onError={setError} onBusy={setLoading} />

          <p className="auth-signup-note">
            {tAuth.login.signupNote}{" "}
            <Link to="/cadastrar">{tAuth.login.signupLink}</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default LoginPage;