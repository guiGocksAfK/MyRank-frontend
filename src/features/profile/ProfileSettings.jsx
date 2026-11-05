import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { updateMe } from '../../services/userService';
import { useLanguage, LANGUAGES } from '../../shared/i18n';
import DeleteAccountModal from './DeleteAccountModal';

/** Linha de ajuste: nome e explicação à esquerda, o controle à direita. */
function Row({ label, desc, children }) {
  return (
    <div className="pf-set-row">
      <div className="pf-set-text">
        <div className="pf-set-label">{label}</div>
        {desc && <div className="pf-set-desc">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function Switch({ on, onClick, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label}
      className={`mr-switch${on ? ' checked' : ''}`} onClick={onClick} disabled={disabled}>
      <span className="mr-switch-thumb" />
    </button>
  );
}

/** Configurações: página dentro do Perfil, com "← Perfil" (igual aos Criadores). */
export default function ProfileSettings({ profile, onUserChange, isDark, onThemeToggle, onBack }) {
  const { t, lang, setLang } = useLanguage();
  const tp = t.profile;
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isPublic = profile.isPublic ?? true;

  const togglePublic = async () => {
    setSavingPrivacy(true);
    try {
      onUserChange(await updateMe({ isPublic: !isPublic }));
    } catch {
      /* fica como estava; o switch não muda */
    } finally {
      setSavingPrivacy(false);
    }
  };

  return (
    <div className="rk-page pf-page">
      <div>
        <button type="button" className="cr-back" onClick={onBack}>
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          {tp.backToProfile}
        </button>
        <h1 className="rk-page-title">{tp.settings}</h1>
      </div>

      <section className="pf-set-section">
        <h2 className="pf-group-title">{tp.appearance}</h2>
        <div className="mr-panel pf-set-panel">
          <Row label={tp.darkMode} desc={tp.darkModeDesc}>
            <Switch on={isDark} onClick={onThemeToggle} label={tp.darkMode} />
          </Row>
          <Row label={tp.language} desc={tp.languageDesc}>
            <div className="rk-seg" role="group" aria-label={tp.language}>
              {LANGUAGES.map((code) => (
                <button key={code} type="button" className={lang === code ? 'is-active' : ''}
                  aria-pressed={lang === code} onClick={() => setLang(code)}>
                  {code}
                </button>
              ))}
            </div>
          </Row>
        </div>
      </section>

      <section className="pf-set-section">
        <h2 className="pf-group-title">{tp.privacy}</h2>
        <div className="mr-panel pf-set-panel">
          <Row label={tp.publicProfile} desc={tp.publicProfileDesc}>
            <Switch on={isPublic} onClick={togglePublic} label={tp.publicProfile} disabled={savingPrivacy} />
          </Row>
        </div>
      </section>

      <section className="pf-set-section">
        <h2 className="pf-group-title">{tp.account}</h2>
        <div className="mr-panel pf-set-panel">
          {profile.email && (
            <Row label={tp.email}>
              <span className="pf-set-value">{profile.email}</span>
            </Row>
          )}
          <Row label={tp.deleteAccount} desc={tp.deleteAccountDesc}>
            <button type="button" className="mr-btn mr-btn-sm mr-btn-danger-text" onClick={() => setDeleting(true)}>
              {tp.deleteAccount}
            </button>
          </Row>
        </div>
      </section>

      {deleting && <DeleteAccountModal user={profile} onClose={() => setDeleting(false)} />}
    </div>
  );
}
