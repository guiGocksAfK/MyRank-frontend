import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/authService";
import { useLanguage } from "../../shared/i18n";
import AuthBackdrop from "./AuthBackdrop";
import PasswordInput from "./PasswordInput";
import "./auth.css";

const MIN_PASSWORD = 8; // mesma regra do cadastro (UserCreateDTO no back)

/** Destino do link do email de redefinição: escolhe a senha nova e volta pro login. */
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useLanguage();
  const tAuth = t.auth;
  const tReset = t.auth.reset;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (password.length < MIN_PASSWORD) {
      setError(tReset.tooShort);
      return;
    }
    if (password !== confirm) {
      setError(tReset.mismatch);
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || tReset.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <AuthBackdrop />

      <Link to="/entrar" className="mr-btn mr-btn-outline mr-btn-sm auth-back">
        {tAuth.back}
      </Link>

      <section className="auth-hero" aria-label={tReset.title}>
        <form className="auth-card mr-panel" onSubmit={handleSubmit}>
          <div className="auth-card-header">
            <h2>My<span>Rank</span></h2>
          </div>

          {!token ? (
            <div className="auth-step-panel">
              <p className="auth-error">{tReset.invalid}</p>
              <Link to="/esqueci-senha" className="mr-btn mr-btn-gold auth-submit">
                {tReset.requestNew}
              </Link>
            </div>
          ) : done ? (
            <div className="auth-step-panel">
              <div className="auth-step-copy">
                <h3>{tReset.doneTitle}</h3>
                <p>{tReset.doneCopy}</p>
              </div>
              <Link to="/entrar" className="mr-btn mr-btn-gold auth-submit">
                {tReset.goToLogin}
              </Link>
            </div>
          ) : (
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
        </form>
      </section>
    </main>
  );
};

export default ResetPasswordPage;
