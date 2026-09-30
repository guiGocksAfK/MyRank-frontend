import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/authService";
import { useLanguage } from "../../shared/i18n";
import AuthBackdrop from "./AuthBackdrop";
import SocialButtons from "./SocialButtons";
import "./auth.css";

const RESEND_COOLDOWN_S = 30;

/** Troca {email} no texto pelo endereço em destaque, pra pessoa notar um erro de digitação. */
const withEmail = (text, email) => {
  const [before, after = ""] = text.split("{email}");
  return <>{before}<strong className="auth-email">{email}</strong>{after}</>;
};

/**
 * "Esqueci minha senha": pede o email e manda o link de redefinição.
 * Conta que só entra pelo Google/Discord recebe o aviso na hora, sem email,
 * e já pode entrar por ali mesmo.
 */
const ForgotPasswordPage = () => {
  const { t } = useLanguage();
  const tAuth = t.auth;
  const tForgot = t.auth.forgot;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [result, setResult] = useState(null); // { status: "SENT" | "SOCIAL", provider }

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const send = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const response = await forgotPassword(email.trim());
      if (result && response.status === "SENT") setNotice(tForgot.resent);
      setResult(response);
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setError(err.response?.data?.message || tForgot.error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!loading) send();
  };

  const changeEmail = () => {
    setResult(null);
    setError("");
    setNotice("");
  };

  const providerName = result?.provider === "DISCORD" ? "Discord" : "Google";
  const view = result?.status === "SOCIAL" ? "social" : result ? "sent" : "form";

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
            <p className="auth-tagline">{tAuth.tagline}</p>
          </div>

          {/* key: cada estado entra com a mesma transição curta */}
          <div key={view} className="auth-swap" aria-live="polite">
            {view === "social" && (
              <div className="auth-step-panel">
                <div className="auth-step-copy">
                  <h3>{tForgot.socialTitle.replaceAll("{provider}", providerName)}</h3>
                  <p>{tForgot.socialCopy.replaceAll("{provider}", providerName)}</p>
                </div>

                <div>
                  <SocialButtons only={result.provider} disabled={loading} onError={setError} onBusy={setLoading} />
                  {error && <p className="auth-error">{error}</p>}
                </div>

                <button className="auth-text-button" type="button" onClick={changeEmail}>
                  {tForgot.otherEmail}
                </button>
              </div>
            )}

            {view === "sent" && (
              <div className="auth-step-panel">
                <div className="auth-step-copy">
                  <h3>{tForgot.sentTitle}</h3>
                  <p>{withEmail(tForgot.sentCopy, email.trim())}</p>
                  <p>{tForgot.sentSpam}</p>
                </div>

                {error && <p className="auth-error">{error}</p>}
                {notice && <p className="auth-resend-note">{notice}</p>}

                <Link to="/entrar" className="mr-btn mr-btn-gold auth-submit">
                  {tForgot.backToLogin}
                </Link>

                <div className="auth-text-actions">
                  <button
                    className="auth-text-button"
                    type="button"
                    onClick={send}
                    disabled={loading || cooldown > 0}
                  >
                    {cooldown > 0 ? tForgot.resendIn.replace("{s}", cooldown) : tForgot.resend}
                  </button>
                  <span aria-hidden="true">·</span>
                  <button className="auth-text-button" type="button" onClick={changeEmail}>
                    {tForgot.otherEmail}
                  </button>
                </div>
              </div>
            )}

            {view === "form" && (
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
                      autoFocus
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
          </div>
        </form>
      </section>
    </main>
  );
};

export default ForgotPasswordPage;
