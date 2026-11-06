import { useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { updateMe, revokeOtherSessions } from '../../services/userService';
import { useLanguage, LANGUAGES } from '../../shared/i18n';
import ConfirmModal from '../../shared/components/ConfirmModal';
import DeleteAccountModal from './DeleteAccountModal';
import ChangePasswordModal from './ChangePasswordModal';
import { exportWorks } from './exportWorks';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

// grupos de aviso (NotificationGroup no back), na ordem da tela
const NOTIFICATION_GROUPS = ['FOLLOWS', 'REACTIONS', 'COMMENTS', 'TAKES', 'GROUPS'];

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

function Section({ title, children }) {
  return (
    <section className="pf-set-section">
      <h2 className="pf-group-title">{title}</h2>
      <div className="mr-panel pf-set-panel">{children}</div>
    </section>
  );
}

/**
 * Configurações: página dentro do Perfil, com "← Perfil" (igual aos Criadores).
 * Cada ajuste salva na hora (PUT /users/me); se der erro, volta como estava.
 */
export default function ProfileSettings({ profile, onUserChange, isDark, onThemeToggle, onBack }) {
  const { t, lang, setLang } = useLanguage();
  const tp = t.profile;
  const [saving, setSaving] = useState(null); // qual ajuste está salvando
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null); // 'delete' | 'password' | 'sessions'
  const [exporting, setExporting] = useState(false);

  const isPublic = profile.isPublic ?? true;
  const dmPolicy = profile.dmPolicy || 'EVERYONE';
  const muted = new Set(profile.mutedNotifications || []);
  const provider = profile.authProvider || 'LOCAL';

  // salva um pedaço e já mostra o novo estado; erro desfaz
  const save = async (key, patch) => {
    const before = profile;
    onUserChange({ ...profile, ...patch });
    setSaving(key);
    setError('');
    try {
      onUserChange(await updateMe(patch));
    } catch (err) {
      onUserChange(before);
      setError(err?.response?.data?.message || tp.settingsError);
    } finally {
      setSaving(null);
    }
  };

  const toggleGroup = (group) => {
    const next = new Set(muted);
    if (next.has(group)) next.delete(group); else next.add(group);
    save(`notif-${group}`, { mutedNotifications: [...next] });
  };

  const doExport = async (format) => {
    setExporting(true);
    setError('');
    try {
      const n = await exportWorks(format);
      setNotice(fmt(n === 1 ? tp.exportDoneOne : tp.exportDone, { n }));
    } catch {
      setError(tp.exportError);
    } finally {
      setExporting(false);
    }
  };

  const providerName = { LOCAL: tp.providerLocal, GOOGLE: 'Google', DISCORD: 'Discord' }[provider] || provider;

  return (
    <div className="rk-page pf-page pf-settings">
      <div>
        <button type="button" className="cr-back" onClick={onBack}>
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          {tp.backToProfile}
        </button>
        <h1 className="rk-page-title">{tp.settings}</h1>
      </div>

      {(error || notice) && (
        <p className={`pf-set-notice${error ? ' is-error' : ''}`} role={error ? 'alert' : 'status'}>{error || notice}</p>
      )}

      <Section title={tp.appearance}>
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
      </Section>

      <Section title={tp.rankingsSection}>
        <Row label={tp.weightedDefault} desc={tp.weightedDefaultDesc}>
          <Switch on={Boolean(profile.weightedByDefault)} label={tp.weightedDefault} disabled={saving === 'weighted'}
            onClick={() => save('weighted', { weightedByDefault: !profile.weightedByDefault })} />
        </Row>
      </Section>

      <Section title={tp.privacy}>
        <Row label={tp.publicProfile} desc={tp.publicProfileDesc}>
          <Switch on={isPublic} label={tp.publicProfile} disabled={saving === 'public'}
            onClick={() => save('public', { isPublic: !isPublic })} />
        </Row>
        <Row label={tp.dmPolicy} desc={tp.dmPolicyDesc}>
          <div className="rk-seg" role="group" aria-label={tp.dmPolicy}>
            {[{ id: 'EVERYONE', label: tp.dmEveryone }, { id: 'FOLLOWING', label: tp.dmFollowing }].map((o) => (
              <button key={o.id} type="button" className={dmPolicy === o.id ? 'is-active' : ''}
                aria-pressed={dmPolicy === o.id} disabled={saving === 'dm'}
                onClick={() => dmPolicy !== o.id && save('dm', { dmPolicy: o.id })}>
                {o.label}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      <Section title={tp.notifications}>
        {NOTIFICATION_GROUPS.map((group) => (
          <Row key={group} label={tp.notif[group].label} desc={tp.notif[group].desc}>
            <Switch on={!muted.has(group)} label={tp.notif[group].label} disabled={saving === `notif-${group}`}
              onClick={() => toggleGroup(group)} />
          </Row>
        ))}
      </Section>

      <Section title={tp.account}>
        {profile.email && (
          <Row label={tp.email}>
            <span className="pf-set-value">{profile.email}</span>
          </Row>
        )}
        <Row label={tp.signInWith} desc={profile.hasPassword ? null : fmt(tp.signInSocialDesc, { provider: providerName })}>
          <span className="pf-set-value">{providerName}</span>
        </Row>
        {profile.hasPassword && (
          <Row label={tp.password} desc={tp.passwordDesc}>
            <button type="button" className="mr-btn mr-btn-sm mr-btn-outline" onClick={() => setModal('password')}>
              {tp.changePassword}
            </button>
          </Row>
        )}
        <Row label={tp.sessions} desc={tp.sessionsDesc}>
          <button type="button" className="mr-btn mr-btn-sm mr-btn-outline" onClick={() => setModal('sessions')}>
            {tp.sessionsButton}
          </button>
        </Row>
      </Section>

      <Section title={tp.yourData}>
        <Row label={tp.exportWorks} desc={tp.exportWorksDesc}>
          <div className="mr-actions pf-set-buttons">
            {['csv', 'json'].map((format) => (
              <button key={format} type="button" className="mr-btn mr-btn-sm mr-btn-outline"
                onClick={() => doExport(format)} disabled={exporting}>
                <Download size={14} strokeWidth={2} aria-hidden="true" />
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </Row>
        <Row label={tp.deleteAccount} desc={tp.deleteAccountDesc}>
          <button type="button" className="mr-btn mr-btn-sm mr-btn-danger-text" onClick={() => setModal('delete')}>
            {tp.deleteAccount}
          </button>
        </Row>
      </Section>

      {modal === 'delete' && <DeleteAccountModal user={profile} onClose={() => setModal(null)} />}
      {modal === 'password' && (
        <ChangePasswordModal email={profile.email} onClose={() => setModal(null)}
          onDone={() => { setModal(null); setError(''); setNotice(tp.passwordDone); }} />
      )}
      {modal === 'sessions' && (
        <ConfirmModal title={tp.sessions} message={tp.sessionsConfirm} confirmLabel={tp.sessionsButton}
          busyLabel={tp.sessionsBusy}
          onClose={() => setModal(null)}
          onConfirm={async () => {
            try {
              await revokeOtherSessions();
              setError('');
              setNotice(tp.sessionsDone);
              return true;
            } catch {
              setError(tp.settingsError);
              return true;
            }
          }} />
      )}
    </div>
  );
}
