import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/authService";
import { useLanguage } from "../../shared/i18n";
import AuthBackdrop from "./AuthBackdrop";
import "./auth.css";

/**
 * "Esqueci minha senha": pede o email e manda o link de redefinição.
 * Conta que só entra pelo Google/Discord recebe o aviso na hora, sem email.
 */
const ForgotPasswordPage = () => {
  const { t } = useLanguage();
  const tAuth = t.auth;
  const tForgot = t.auth.forgot;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // { status: "SENT" | "SOCIAL", provider }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      setResult(await forgotPassword(email.trim()));
    } catch (err) {
      setError(err.response?.data?.message || tForgot.error);
    } finally {
      setLoading(false);
    }
  };

  const providerName = result?.provider === "DISCORD" ? "Discord" : "Google";

  return (
    <main className="auth-page">
      <AuthBackdrop />

      <Link to="/entrar" className="mr-btn mr-btn-outline mr-btn-sm auth-back">
        {tAuth.back}
      </Link>

      <section className="auth-hero" aria-label={tForgot.title}>
        <form className="auth-card mr-panel" onSubmit={handleSubmit}>
          <div className="auth-card-header">
            <h2>My<span>Rank</span></h2>
          </div>

          {result?.status === "SOCIAL" ? (
            <div className="auth-step-panel">
              <div className="auth-step-copy">
                <h3>{tForgot.socialTitle}</h3>
                <p>{tForgot.socialCopy.replaceAll("{provider}", providerName)}</p>
              </div>
              <Link to="/entrar" className="mr-btn mr-btn-gold auth-submit">
                {tForgot.backToLogin}
              </Link>
            </div>
          ) : result ? (
            <div className="auth-step-panel">
              <div className="auth-step-copy">
                <h3>{tForgot.sentTitle}</h3>
                <p>{tForgot.sentCopy.replace("{email}", email.trim())}</p>
                <p>{tForgot.sentSpam}</p>
              </div>
              <Link to="/entrar" className="mr-btn mr-btn-gold auth-submit">
                {tForgot.backToLogin}
              </Link>
            </div>
          ) : (
            <div className="auth-step-panel">
              <div className="auth-step-copy">
                <h3>{tForgot.title}</h3>
                <p>{tForgot.copy}</p>
              </div>

              <div className="auth-fields">
                <label className="auth-field" htmlFor="email">
                  <span>{tAuth.emailLabel}</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder={tAuth.emailPlaceholder}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button className="mr-btn mr-btn-gold auth-submit" type="submit" disabled={loading}>
                {loading ? tForgot.submitting : tForgot.submit}
              </button>
            </div>
          )}
        </form>
      </section>
    </main>
  );
};

export default ForgotPasswordPage;
