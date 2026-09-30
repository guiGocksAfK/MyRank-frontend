import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword, takePostAuthPath, verifyResetCode } from "../../services/authService";
import { useLanguage } from "../../shared/i18n";
import AuthBackdrop from "./AuthBackdrop";
import CodeInput from "./CodeInput";
import PasswordInput from "./PasswordInput";
import SocialButtons from "./SocialButtons";
import "./auth.css";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_S = 30; // igual ao intervalo mínimo do backend

/** Troca {email} no texto pelo endereço em destaque, pra pessoa notar um erro de digitação. */
const withEmail = (text, email) => {
  const [before, after = ""] = text.split("{email}");
  return <>{before}<strong className="auth-email">{email}</strong>{after}</>;
};

/**
 * "Esqueci minha senha", tudo na mesma aba: email → código de 6 dígitos → senha
 * nova, já entrando na conta. Conta que só entra pelo Google/Discord recebe o
 * aviso na hora, sem email, e já pode entrar por ali mesmo.
 */
const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const tAuth = t.auth;
  const tForgot = t.auth.forgot;
  const tReset = t.auth.reset;
  const [view, setView] = useState("email"); // email | code | password | social
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState(null);
  const [code, setCode] = useState("");
  const [resetPass, setResetPass] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // contagem do "Reenviar em Xs"; o estado só muda dentro do timer
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const apiError = (err, fallback) => err.response?.data?.message || fallback;

  const sendCode = async ({ resend = false } = {}) => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const response = await forgotPassword(email.trim());
      if (response.status === "SOCIAL") {
        setProvider(response.provider);
        setView("social");
        return;
      }
      setCode("");
      setView("code");
      setCooldown(RESEND_COOLDOWN_S);
      if (resend) setNotice(tForgot.resent);
    } catch (err) {
      setError(apiError(err, tForgot.error));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (value = code) => {
    setError("");
    setNotice("");
    if (value.length !== CODE_LENGTH) return;

    setLoading(true);
    try {
      setResetPass(await verifyResetCode(email.trim(), value));
      setView("password");
    } catch (err) {
      setCode("");
      setError(apiError(err, tForgot.error));
    } finally {
      setLoading(false);
    }
  };

  // completou os 6, confere sozinho (colar do email também cai aqui)
  const handleCodeChange = (digits) => {
    setCode(digits);
    if (error) setError("");
    if (digits.length === CODE_LENGTH && !loading) verify(digits);
  };

  const savePassword = async () => {
    setError("");
    if (password.length < 8) {
      setError(tReset.tooShort);
      return;
    }
    if (password !== confirm) {
      setError(tReset.mismatch);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetPass, password);
      navigate(takePostAuthPath());
    } catch (err) {
      setError(apiError(err, tReset.error));
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (loading) return;
    if (view === "email") sendCode();
    else if (view === "code") verify();
    else if (view === "password") savePassword();
  };

  const changeEmail = () => {
    setView("email");
    setCode("");
    setResetPass("");
    setError("");
    setNotice("");
  };

  const providerName = provider === "DISCORD" ? "Discord" : "Google";

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

          {/* key: cada etapa entra com a mesma transição curta */}
          <div key={view} className="auth-swap" aria-live="polite">
            {view === "email" && (
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

            {view === "code" && (
              <div className="auth-step-panel">
                <div className="auth-step-copy">
                  <h3>{tForgot.sentTitle}</h3>
                  <p>{withEmail(tForgot.sentCopy, email.trim())}</p>
                  <p>{tForgot.sentSpam}</p>
                </div>

                <label className="auth-field" htmlFor="code">
                  <span>{tForgot.codeLabel}</span>
                  <CodeInput
                    id="code"
                    length={CODE_LENGTH}
                    autoFocus
                    value={code}
                    onChange={handleCodeChange}
                    disabled={loading}
                    invalid={!!error}
                  />
                </label>

                {error && <p className="auth-error">{error}</p>}
                {notice && <p className="auth-resend-note">{notice}</p>}

                <button
                  className="mr-btn mr-btn-gold auth-submit"
                  type="submit"
                  disabled={loading || code.length !== CODE_LENGTH}
                >
                  {loading ? tForgot.codeChecking : tForgot.codeSubmit}
                </button>

                <div className="auth-text-actions">
                  <button
                    className="auth-text-button"
                    type="button"
                    onClick={() => sendCode({ resend: true })}
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

            {view === "password" && (
              <div className="auth-step-panel">
                <div className="auth-step-copy">
                  <h3>{tReset.title}</h3>
                  <p>{tReset.copy}</p>
                </div>

                <div className="auth-fields">
                  <label className="auth-field" htmlFor="password">
                    <span>{tReset.newPasswordLabel}</span>
                    <PasswordInput
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </label>

                  <label className="auth-field" htmlFor="confirm">
                    <span>{tAuth.passwordConfirmLabel}</span>
                    <PasswordInput
                      id="confirm"
                      name="confirm"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                  </label>
                </div>

                {error && <p className="auth-error">{error}</p>}

                <button className="mr-btn mr-btn-gold auth-submit" type="submit" disabled={loading}>
                  {loading ? tReset.submitting : tReset.submit}
                </button>
              </div>
            )}

            {view === "social" && (
              <div className="auth-step-panel">
                <div className="auth-step-copy">
                  <h3>{tForgot.socialTitle.replaceAll("{provider}", providerName)}</h3>
                  <p>{tForgot.socialCopy.replaceAll("{provider}", providerName)}</p>
                </div>

                <div>
                  <SocialButtons only={provider} disabled={loading} onError={setError} onBusy={setLoading} />
                  {error && <p className="auth-error">{error}</p>}
                </div>

                <button className="auth-text-button" type="button" onClick={changeEmail}>
                  {tForgot.otherEmail}
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
