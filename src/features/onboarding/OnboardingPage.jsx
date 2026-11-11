import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, ListOrdered, Plus, Scale, Sparkles, Users } from 'lucide-react';
import { getMe } from '../../services/userService';
import { getCategories } from '../../services/CategoryService';
import { createWork } from '../../services/WorkService';
import { chooseOnboardingTables, finishOnboarding } from '../../services/onboardingService';
import { isAuthenticated } from '../../services/authService';
import { mapCategoryToTable, mapItemToWorkDTO } from '../../utils/mapWork';
import { useLanguage } from '../../shared/i18n';
import { TABLE_TEMPLATES, TEMPLATE_ICONS } from '../../shared/tableTemplates';
import AuthBackdrop from '../auth/AuthBackdrop';
import ItemModal from '../rankings/rankings/ItemModal';
import '../auth/auth.css';
import './onboarding.css';

// Personalizado fica de fora: ele nasce vazio e a pessoa monta depois.
const CHOICES = Object.keys(TABLE_TEMPLATES).filter(template => template !== 'custom');
const STEPS = ['welcome', 'tables', 'first', 'done'];
const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

/**
 * Tutorial pós-cadastro, aprendendo fazendo: boas-vindas (o que dá pra fazer) →
 * escolher tabelas → primeira obra (dá pra pular) → por onde começar. O passo
 * fica salvo no backend, então quem fecha no meio volta de onde parou.
 * Só no dev, `/bem-vindo?teste` abre do começo sem salvar nada (o botão
 * "Tutorial" ao lado de "Dados de teste" na Social).
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const testMode = import.meta.env.DEV && new URLSearchParams(location.search).has('teste');
  const { t, locale } = useLanguage();
  const to = t.onboarding;
  const typeName = template => t.common.mediaTypes[TABLE_TEMPLATES[template]?.type] ?? t.common.mediaTypes.outro;
  const [step, setStep] = useState(testMode ? 'welcome' : null); // welcome | tables | first | done
  const [picked, setPicked] = useState([]);
  const [tables, setTables] = useState([]);
  const [tableId, setTableId] = useState(null);
  const [adding, setAdding] = useState(false);
  // a obra já foi criada: aparece como vai ficar no ranking e não dá pra criar outra
  const [savedWork, setSavedWork] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (testMode) return;
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
  }, [navigate, testMode]);

  const toggle = template => setPicked(current => (current.includes(template)
    ? current.filter(t2 => t2 !== template) : [...current, template]));

  async function confirmTables() {
    setBusy(true);
    setError('');
    try {
      const created = testMode
        // teste: tabelas de mentira, no mesmo formato das de verdade
        ? picked.map((template, i) => ({ id: -(i + 1), label: typeName(template), templates: [template], subcategories: [], customFields: [], items: [] }))
        : (await chooseOnboardingTables(picked)).map(category => mapCategoryToTable(category));
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
      if (!testMode) await finishOnboarding();
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || to.error);
    } finally {
      setBusy(false);
    }
  }

  async function saveFirstWork(payload) {
    if (!testMode) await createWork(mapItemToWorkDTO(payload, tableId));
    setSavedWork(payload);
  }

  const table = tables.find(tb => tb.id === tableId);
  const goTo = tab => navigate('/dashboard', { replace: true, state: { tab } });
  const iconOf = template => TEMPLATE_ICONS[template] ?? TEMPLATE_ICONS.custom;

  if (!step) return null;
  const index = STEPS.indexOf(step);

  const FEATURES = [
    { icon: ListOrdered, title: to.feat1Title, text: to.feat1 },
    { icon: Scale, title: to.feat2Title, text: to.feat2 },
    { icon: Sparkles, title: to.feat3Title, text: to.feat3 },
  ];
  const PLACES = [
    { tab: 'rankings', icon: ListOrdered, title: to.rankingsTitle, text: to.rankingsText },
    { tab: 'social', icon: Users, title: to.socialTitle, text: to.socialText },
    { tab: 'ai', icon: Sparkles, title: to.aiTitle, text: to.aiText },
  ];

  return (
    <main className="auth-page">
      <AuthBackdrop />
      <section className="auth-hero">
        <div className="mr-panel ob-card">
          <header className="ob-head">
            <span className="ob-logo">My<span>Rank</span></span>
            <span className="ob-step">{fmt(to.step, { n: index + 1, total: STEPS.length })}</span>
          </header>
          <div className="ob-progress" aria-hidden="true">
            {STEPS.map((s, i) => <span key={s} className={i <= index ? 'is-on' : ''} />)}
          </div>
          {testMode && <p className="ob-test">{to.testBanner}</p>}

          <div key={step} className="auth-swap ob-body">
            {step === 'welcome' && (
              <>
                <div className="ob-copy">
                  <h1>{to.welcomeTitle}</h1>
                  <p>{to.welcomeCopy}</p>
                </div>
                <ul className="ob-features">
                  {FEATURES.map(({ icon: Icon, title, text }) => (
                    <li key={title}>
                      <span className="ob-icon" aria-hidden="true"><Icon size={18} strokeWidth={1.8} /></span>
                      <span><b>{title}</b>{text}</span>
                    </li>
                  ))}
                </ul>
                <button className="mr-btn mr-btn-gold ob-main" type="button" onClick={() => setStep('tables')}>
                  {to.start}
                </button>
              </>
            )}

            {step === 'tables' && (
              <>
                <div className="ob-copy">
                  <h1>{to.tablesTitle}</h1>
                  <p>{to.tablesCopy}</p>
                </div>
                <div role="group" aria-label={to.tablesTitle} className="ob-tiles">
                  {CHOICES.map(template => {
                    const selected = picked.includes(template);
                    const Icon = iconOf(template);
                    return (
                      <button key={template} type="button" aria-pressed={selected} onClick={() => toggle(template)}
                        className={`ob-tile${selected ? ' is-on' : ''}`}>
                        <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                        <span>{typeName(template)}</span>
                        {selected && <span className="ob-tile-check" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>}
                      </button>
                    );
                  })}
                </div>
                {error && <p className="auth-error" role="alert">{error}</p>}
                <div className="ob-actions">
                  <button className="ob-back" type="button" onClick={() => setStep('welcome')}>
                    <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
                    {to.back}
                  </button>
                  <button className="mr-btn mr-btn-gold" type="button" onClick={confirmTables} disabled={busy || picked.length === 0}>
                    {picked.length === 0 ? to.pickOne : to.next}
                  </button>
                </div>
              </>
            )}

            {step === 'first' && (
              <>
                <div className="ob-copy">
                  <h1>{to.firstTitle}</h1>
                  <p>{to.firstCopy}</p>
                </div>
                {tables.length > 1 && !savedWork && (
                  <div role="group" aria-label={to.firstTitle} className="ob-tables">
                    {tables.map(tb => {
                      const Icon = iconOf(tb.templates[0]);
                      return (
                        <button key={tb.id} type="button" aria-pressed={tb.id === tableId}
                          className={`ob-table${tb.id === tableId ? ' is-on' : ''}`} onClick={() => setTableId(tb.id)}>
                          <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                          {tb.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* a obra como vai aparecer no ranking (ou o lugar dela, ainda vazio) */}
                {savedWork ? (
                  <div className="ob-work">
                    <span className="ob-work-rank">1</span>
                    <span className="ob-work-cover">
                      {savedWork.image ? <img src={savedWork.image} alt="" /> : (() => {
                        const Icon = iconOf(savedWork.template);
                        return <Icon size={18} strokeWidth={1.8} aria-hidden="true" />;
                      })()}
                    </span>
                    <span className="ob-work-text">
                      <b>{savedWork.title}</b>
                      <small>{fmt(to.savedIn, { table: table?.label ?? '' })}</small>
                    </span>
                    <span className="ob-work-note">{Number(savedWork.note).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                  </div>
                ) : (
                  <button type="button" className="ob-work is-empty" onClick={() => setAdding(true)} disabled={busy || !table}>
                    <span className="ob-work-rank">1</span>
                    <span className="ob-work-cover"><Plus size={18} strokeWidth={2} aria-hidden="true" /></span>
                    <span className="ob-work-text"><b>{to.firstEmpty}</b></span>
                  </button>
                )}

                {error && <p className="auth-error" role="alert">{error}</p>}
                {savedWork ? (
                  <button className="mr-btn mr-btn-gold ob-main" type="button" onClick={finish} disabled={busy}>{to.next}</button>
                ) : (
                  <div className="ob-actions">
                    <button className="ob-back" type="button" onClick={finish} disabled={busy}>{to.later}</button>
                    <button className="mr-btn mr-btn-gold" type="button" onClick={() => setAdding(true)} disabled={busy || !table}>
                      {to.addFirst}
                    </button>
                  </div>
                )}
              </>
            )}

            {step === 'done' && (
              <>
                <div className="ob-copy">
                  <h1>{to.doneTitle}</h1>
                  <p>{to.doneCopy}</p>
                </div>
                <p className="ob-label">{to.whereTitle}</p>
                <div className="ob-places">
                  {PLACES.map(({ tab, icon: Icon, title, text }) => (
                    <button key={tab} type="button" className="ob-place" onClick={() => goTo(tab)}>
                      <span className="ob-icon" aria-hidden="true"><Icon size={18} strokeWidth={1.8} /></span>
                      <span className="ob-place-text"><b>{title}</b>{text}</span>
                      <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <button className="mr-btn mr-btn-gold ob-main" type="button" onClick={() => goTo('rankings')}>
                  {to.goRankings}
                </button>
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
