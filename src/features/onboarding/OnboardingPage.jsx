import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../../services/userService';
import { getCategories } from '../../services/CategoryService';
import { createWork } from '../../services/WorkService';
import { chooseOnboardingTables, finishOnboarding } from '../../services/onboardingService';
import { isAuthenticated } from '../../services/authService';
import { mapCategoryToTable, mapItemToWorkDTO } from '../../utils/mapWork';
import { useLanguage } from '../../shared/i18n';
import { TABLE_TEMPLATES } from '../../shared/tableTemplates';
import AuthBackdrop from '../auth/AuthBackdrop';
import ItemModal from '../rankings/rankings/ItemModal';
import '../auth/auth.css';

// Personalizado fica de fora: ele nasce vazio e a pessoa monta depois.
const CHOICES = Object.keys(TABLE_TEMPLATES).filter(template => template !== 'custom');

/**
 * Tutorial pós-cadastro, aprendendo fazendo: boas-vindas → escolher tabelas →
 * primeira obra (dá pra pular) → pronto. O passo fica salvo no backend, então
 * quem fecha no meio volta de onde parou. Visual simples; o acabamento é do remaster.
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const to = t.onboarding;
  const [step, setStep] = useState(null); // welcome | tables | first | done
  const [picked, setPicked] = useState([]);
  const [tables, setTables] = useState([]);
  const [tableId, setTableId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/entrar', { replace: true });
      return;
    }
    getMe().then(async me => {
      if (me.onboardingStep === 'FIRST_WORK') {
        const own = (await getCategories()).map(category => mapCategoryToTable(category));
        setTables(own);
        setTableId(own[0]?.id ?? null);
        setStep('first');
      } else if (me.onboardingStep === 'TABLES') {
        setStep('welcome');
      } else {
        navigate('/dashboard', { replace: true });
      }
    }).catch(() => navigate('/entrar', { replace: true }));
  }, [navigate]);

  const toggle = template => setPicked(current => (current.includes(template)
    ? current.filter(t2 => t2 !== template) : [...current, template]));

  async function confirmTables() {
    setBusy(true);
    setError('');
    try {
      const created = (await chooseOnboardingTables(picked)).map(category => mapCategoryToTable(category));
      setTables(created);
      setTableId(created[0]?.id ?? null);
      setStep('first');
    } catch (err) {
      setError(err.response?.data?.message || to.error);
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    setError('');
    try {
      await finishOnboarding();
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || to.error);
    } finally {
      setBusy(false);
    }
  }

  async function saveFirstWork(payload) {
    await createWork(mapItemToWorkDTO(payload, tableId));
    await finish();
  }

  const table = tables.find(tb => tb.id === tableId);
  const goTo = tab => navigate('/dashboard', { replace: true, state: { tab } });

  if (!step) return null;

  return (
    <main className="auth-page">
      <AuthBackdrop />
      <section className="auth-hero">
        <div className="auth-card mr-panel">
          <div className="auth-card-header">
            <h2>My<span>Rank</span></h2>
          </div>

          <div key={step} className="auth-swap auth-step-panel">
            {step === 'welcome' && (
              <>
                <div className="auth-step-copy">
                  <h3>{to.welcomeTitle}</h3>
                  <p>{to.welcomeCopy}</p>
                </div>
                <button className="mr-btn mr-btn-gold auth-submit" type="button" onClick={() => setStep('tables')}>
                  {to.start}
                </button>
              </>
            )}

            {step === 'tables' && (
              <>
                <div className="auth-step-copy">
                  <h3>{to.tablesTitle}</h3>
                  <p>{to.tablesCopy}</p>
                </div>
                <div role="group" aria-label={to.tablesTitle} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CHOICES.map(template => {
                    const selected = picked.includes(template);
                    return (
                      <button
                        key={template}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggle(template)}
                        style={{
                          padding: '8px 14px', borderRadius: 999, cursor: 'pointer', font: 'inherit', fontSize: 14,
                          border: `1px solid ${selected ? 'var(--mr-gold)' : 'rgba(255,255,255,0.14)'}`,
                          background: selected ? 'var(--mr-gold-10)' : 'transparent',
                          color: selected ? 'var(--mr-text)' : 'var(--mr-text-secondary)',
                        }}
                      >
                        {t.rankings.types[TABLE_TEMPLATES[template].type]}
                      </button>
                    );
                  })}
                </div>
                {error && <p className="auth-error">{error}</p>}
                <button className="mr-btn mr-btn-gold auth-submit" type="button"
                  onClick={confirmTables} disabled={busy || picked.length === 0}>
                  {picked.length === 0 ? to.pickOne : to.next}
                </button>
              </>
            )}

            {step === 'first' && (
              <>
                <div className="auth-step-copy">
                  <h3>{to.firstTitle}</h3>
                  <p>{to.firstCopy}</p>
                </div>
                {tables.length > 1 && (
                  <select value={tableId ?? ''} onChange={e => setTableId(Number(e.target.value))}
                    className="mr-input" style={{ width: '100%' }}>
                    {tables.map(tb => <option key={tb.id} value={tb.id}>{tb.label}</option>)}
                  </select>
                )}
                {error && <p className="auth-error">{error}</p>}
                <button className="mr-btn mr-btn-gold auth-submit" type="button"
                  onClick={() => setAdding(true)} disabled={busy || !table}>
                  {to.addFirst}
                </button>
                <button className="auth-text-button" type="button" onClick={finish} disabled={busy}>
                  {to.later}
                </button>
              </>
            )}

            {step === 'done' && (
              <>
                <div className="auth-step-copy">
                  <h3>{to.doneTitle}</h3>
                  <p>{to.doneCopy}</p>
                </div>
                <button className="mr-btn mr-btn-gold auth-submit" type="button" onClick={() => goTo('rankings')}>
                  {to.goRankings}
                </button>
                <div className="auth-text-actions">
                  <button className="auth-text-button" type="button" onClick={() => goTo('ai')}>{to.goAi}</button>
                  <span aria-hidden="true">·</span>
                  <button className="auth-text-button" type="button" onClick={() => goTo('social')}>{to.goSocial}</button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {adding && table && (
        <ItemModal
          templates={table.templates}
          customFields={table.customFields}
          onSave={saveFirstWork}
          onClose={() => setAdding(false)}
        />
      )}
    </main>
  );
}
