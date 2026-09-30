import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  register,
  sendSignupCode,
  takePostAuthPath,
  verifySignupCode,
} from "../../services/authService";
import { useLanguage } from "../../shared/i18n";
import AuthBackdrop from "./AuthBackdrop";
import CodeInput from "./CodeInput";
import PasswordInput from "./PasswordInput";
import SocialButtons from "./SocialButtons";
import "./auth.css";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_S = 30; // igual ao intervalo mínimo do backend

const RegisterPage = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const tAuth = t.auth;
  const tReg = tAuth.register;
  // 1 email · 2 código do email · 3 usuário/senha. A conta só nasce na etapa 3.
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [signupPass, setSignupPass] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // contagem do "Reenviar em Xs"; o estado só muda dentro do timer
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const apiError = (err, fallback) => err.response?.data?.message || fallback;

  const handleSendCode = async () => {
    setError("");
    setNotice("");

    if (!email.trim()) {
      setError(tAuth.errors.emailRequired);
      return;
    }

    setLoading(true);
    try {
      await sendSignupCode(email.trim(), lang);
      setCode("");
      setStep(2);
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setError(apiError(err, tAuth.errors.createAccount));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      await sendSignupCode(email.trim(), lang);
      setCode("");
      setNotice(tReg.resent);
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setError(apiError(err, tAuth.errors.createAccount));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (value = code) => {
    setError("");
    setNotice("");
    if (value.length !== CODE_LENGTH) return;

    setLoading(true);
    try {
      setSignupPass(await verifySignupCode(email.trim(), value));
      setStep(3);
    } catch (err) {
      setCode("");
      setError(apiError(err, tAuth.errors.createAccount));
    } finally {
      setLoading(false);
    }
  };

  // completou os 6, confere sozinho (colar do email também cai aqui)
  const handleCodeChange = (digits) => {
    setCode(digits);
    if (error) setError("");
    if (digits.length === CODE_LENGTH && !loading) handleVerify(digits);
  };

  const backToEmail = () => {
    setError("");
    setNotice("");
    setCode("");
    setSignupPass("");
    setStep(1);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (loading) return;
    if (step === 1) handleSendCode();
    else if (step === 2) handleVerify();
    else handleCreate();
  };

  const handleCreate = async () => {
    setError("");

    if (!username.trim()) {
      setError(tAuth.errors.usernameRequired);
      return;
    }

    if (password.length < 8) {
      setError(tAuth.errors.passwordShort);
      return;
    }

    if (password !== confirm) {
      setError(tAuth.errors.passwordMismatch);
      return;
    }

    setLoading(true);

    try {
      // email já confirmado na etapa 2: a conta nasce ativa e já entra
      await register({ signupPass, username: username.trim(), password, language: lang });
      navigate(takePostAuthPath());
    } catch (err) {
      setError(apiError(err, tAuth.errors.createAccount));
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <AuthBackdrop />

      <Link to="/" className="mr-btn mr-btn-outline mr-btn-sm auth-back">
        {tAuth.back}
      </Link>

      <section className="auth-hero" aria-label={tAuth.register.title}>
        <form className="auth-card mr-panel" onSubmit={handleSubmit}>
          <div className="auth-card-header">
            <h2>My<span>Rank</span></h2>
            <p className="auth-tagline">{tAuth.tagline}</p>
            <p className="auth-step-label">{tReg.stepLabel.replace("{step}", step)}</p>
          </div>

          {step === 2 ? (
            <div className="auth-step-panel">
              <div className="auth-step-copy">
                <h3>{tReg.codeTitle}</h3>
                <p>{tReg.codeCopy.replace("{email}", email.trim())}</p>
                <p>{tReg.codeSpam}</p>
              </div>

              <label className="auth-field" htmlFor="code">
                <span>{tReg.codeLabel}</span>
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

              <div className="auth-button-row">
                <button className="auth-secondary-button" type="button" onClick={backToEmail}>
                  {tReg.back}
                </button>
                <button
                  className="mr-btn mr-btn-gold auth-submit auth-submit--inline"
                  type="submit"
                  disabled={loading || code.length !== CODE_LENGTH}
                >
                  {loading ? tReg.codeChecking : tReg.codeSubmit}
                </button>
              </div>

              <button
                className="auth-text-button"
                type="button"
                onClick={handleResend}
                disabled={loading || cooldown > 0}
              >
                {cooldown > 0 ? tReg.resendIn.replace("{s}", cooldown) : tReg.resend}
              </button>
            </div>
          ) : step === 1 ? (
            <div className="auth-step-panel">
              <div className="auth-step-copy">
                <h3>{tAuth.register.step1Title}</h3>
                <p>{tAuth.register.step1Copy}</p>
              </div>

              {/* bloco comum (nao grid) pra ter o mesmo espacamento da tela de entrar */}
              <div>
                <div className="auth-fields">
                  <label className="auth-field" htmlFor="email">
                    <span>{tAuth.emailLabel}</span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={tAuth.emailPlaceholder}
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>

                  {error && <p className="auth-error">{error}</p>}

                  <button
                    className="mr-btn mr-btn-gold auth-submit auth-submit--compact"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? tReg.sending : tReg.continue}
                  </button>
                </div>

                <div className="auth-divider">
                  <span>{tAuth.orContinue}</span>
                </div>

                <SocialButtons disabled={loading} onError={setError} onBusy={setLoading} />

                <p className="auth-signup-note">
                  {tAuth.register.loginNote} <Link to="/entrar">{tAuth.register.loginLink}</Link>
                </p>
              </div>
            </div>
          ) : (
            <div className="auth-step-panel">
              <div className="auth-step-copy">
                <h3>{tReg.step3Title}</h3>
                <p>{tReg.step3Copy}</p>
              </div>

              <div className="auth-fields">
                <label className="auth-field" htmlFor="username">
                  <span>{tAuth.usernameLabel}</span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder={tAuth.usernamePlaceholder}
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="password">
                  <span>{tAuth.passwordLabel}</span>
                  <PasswordInput
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
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

              <div className="auth-button-row">
                <button className="auth-secondary-button" type="button" onClick={backToEmail}>
                  {tAuth.register.back}
                </button>
                <button className="mr-btn mr-btn-gold auth-submit auth-submit--inline" type="submit" disabled={loading}>
                  {loading ? tAuth.register.submitting : tAuth.register.submit}
                </button>
              </div>
            </div>
          )}
        </form>
      </section>
    </main>
  );
};

export default RegisterPage;