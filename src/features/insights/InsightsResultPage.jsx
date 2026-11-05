import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUp, RefreshCw } from 'lucide-react';
import { generateInsights, getLatestInsights, sendInsightChat } from '../../services/insightsService';
import { useLanguage } from '../../shared/i18n';
import InfoTip from '../../shared/components/InfoTip';
import { genreKeys, genreLabel } from '../../shared/genres';
import { relativeTime } from '../../shared/useUnifiedItems';
import '../rankings/rankings/rankings.css';
import './insights.css';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
const plural = (pair, n) => fmt(n === 1 ? pair[0] : pair[1], { n });

/**
 * Resultado da IA Insights, dentro do app (com a navbar). Lê como um relatório:
 * título e resumo, traços, gêneros, recomendações com capa e o chat no pé.
 * Com `workIds` gera (ou reaproveita do cache do back); sem, abre a última análise.
 */
export default function InsightsResult({ workIds = null, onBack }) {
  const { t } = useLanguage();
  const tr = t.insights.result;
  const [status, setStatus] = useState('loading'); // loading | ready | empty | error
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let active = true;
    const load = workIds ? generateInsights(workIds, false) : getLatestInsights();
    load
      .then((data) => {
        if (!active) return;
        if (!data) { setStatus('empty'); return; }
        setResult(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (!active) return;
        setErrorMessage(err?.response?.data?.message || tr.errorDefault);
        setStatus('error');
      });
    return () => { active = false; };
  }, [workIds, tr.errorDefault]);

  const regenerate = async () => {
    if (!workIds || regenerating) return;
    setRegenerating(true);
    setErrorMessage('');
    try {
      const data = await generateInsights(workIds, true);
      setResult(data);
      setStatus('ready');
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || tr.errorDefault);
      setStatus('error');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="rk-page ir-page">
      <button type="button" className="ir-back" onClick={onBack}>
        <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
        {tr.back}
      </button>

      {status === 'loading' && (
        <div className="ir-loading" role="status">
          <div className="insights-spinner" />
          <p>{tr.loading}</p>
        </div>
      )}
      {status === 'empty' && (
        <div className="insights-state-card">
          <div className="insights-state-title">{tr.emptyTitle}</div>
          <div className="insights-state-text">{tr.emptyText}</div>
          <div className="insights-state-actions">
            <button type="button" className="mr-btn mr-btn-gold" onClick={onBack}>{tr.backButton}</button>
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="insights-state-card">
          <div className="insights-state-title">{tr.errorTitle}</div>
          <div className="insights-state-text">{errorMessage}</div>
          <div className="insights-state-actions">
            {workIds && (
              <button type="button" className="mr-btn mr-btn-gold" onClick={regenerate} disabled={regenerating}>
                {regenerating ? tr.retrying : tr.retry}
              </button>
            )}
            <button type="button" className="mr-btn mr-btn-ghost" onClick={onBack}>{tr.backButton}</button>
          </div>
        </div>
      )}
      {status === 'ready' && result && (
        <ReadyView
          result={result}
          canRegenerate={Boolean(workIds)}
          regenerating={regenerating}
          onRegenerate={regenerate}
          onResult={setResult}
        />
      )}
    </div>
  );
}

function ReadyView({ result, canRegenerate, regenerating, onRegenerate, onResult }) {
  const { t, lang, locale } = useLanguage();
  const tr = t.insights.result;
  const { analysis, workCount, generatedAt } = result;
  const traits = Array.isArray(analysis.traits) ? analysis.traits : [];
  const contradictions = Array.isArray(analysis.contradictions) ? analysis.contradictions : [];
  const taste = Array.isArray(analysis.tasteProfile) ? analysis.tasteProfile : [];
  // até 3 na lista; análise bem antiga ainda manda uma só em `recommendation`
  const recos = (analysis.recommendations ?? (analysis.recommendation ? [analysis.recommendation] : []))
    .filter((r) => r?.title);
  // análises antigas trazem a % que a IA inventava em vez de média + nº de obras
  const maxPercent = Math.max(1, ...taste.map((s) => s.percent || 0));
  const genreName = (raw) => genreLabel(genreKeys([raw])[0] ?? raw, t.rankings.genreNames);
  const decimal = (n) => n.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <>
      <header className="ir-hero insights-enter">
        <div className="ir-hero-meta">
          <span className="ir-eyebrow">{tr.eyebrow}</span>
          <span>{plural(tr.works, workCount)}</span>
          {generatedAt && <span>{fmt(tr.generated, { when: relativeTime(generatedAt, lang) })}</span>}
          {canRegenerate && (
            <button type="button" className="ir-regen" onClick={onRegenerate} disabled={regenerating}>
              <RefreshCw size={13} strokeWidth={2} className={regenerating ? 'is-spinning' : ''} aria-hidden="true" />
              {regenerating ? tr.regenerating : tr.regenerate}
            </button>
          )}
        </div>
        <h1 className="ir-title">{analysis.summaryTitle}</h1>
        <p className="ir-summary">{analysis.summaryText}</p>
      </header>

      {traits.length > 0 && (
        <section className="insights-enter" style={{ '--d': '60ms' }}>
          <h2 className="ir-section">{tr.traits}</h2>
          <ol className="ir-traits">
            {traits.map((trait, i) => (
              <li key={`${trait.label}-${i}`}>
                <span className="ir-num">{String(i + 1).padStart(2, '0')}</span>
                <strong>{trait.label}</strong>
                <p>{trait.description}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {contradictions.length > 0 && (
        <section className="insights-enter" style={{ '--d': '90ms' }}>
          <h2 className="ir-section">{tr.contradictions}</h2>
          <ul className="ir-contradictions">
            {contradictions.map((item, i) => <li key={i}>{item.text}</li>)}
          </ul>
        </section>
      )}

      {taste.length > 0 && (
        <section className="insights-enter" style={{ '--d': '120ms' }}>
          <h2 className="ir-section">{tr.genres}</h2>
          <ul className="ir-genres">
            {taste.map((slice, i) => {
              const hasAvg = typeof slice.average === 'number';
              const width = hasAvg ? slice.average * 10 : ((slice.percent || 0) / maxPercent) * 100;
              return (
                <li key={`${slice.name}-${i}`} style={{ '--ir-fade': Math.max(0.4, 1 - i * 0.14) }}>
                  <span className="ir-genre-name">{genreName(slice.name)}</span>
                  <span className="ir-genre-bar"><span style={{ width: `${Math.round(width)}%` }} /></span>
                  <span className="ir-genre-meta">
                    {hasAvg ? <><b>{decimal(slice.average)}</b> · {plural(tr.works, slice.count)}</> : `${slice.percent}%`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {recos.length > 0 && (
        <section className="insights-enter" style={{ '--d': '160ms' }}>
          <h2 className="ir-section">{tr.recos}</h2>
          <div className="ir-recos">
            {recos.map((reco) => <RecoCard key={reco.title} reco={reco} labels={tr} />)}
          </div>
        </section>
      )}

      <InsightChat
        insightId={result.id}
        initialChat={Array.isArray(result.chat) ? result.chat : []}
        dailyLimit={result.dailyLimit || 15}
        dailyRemaining={typeof result.dailyRemaining === 'number' ? result.dailyRemaining : 15}
        onResult={onResult}
      />
    </>
  );
}

/** Recomendação: capa (achada pelo back na geração), nome, tipo · ano e o motivo. */
function RecoCard({ reco, labels }) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  const cover = reco.posterUrl && !broken ? reco.posterUrl : null;
  const long = (reco.reason ?? '').length > 220;
  return (
    <article className="ir-reco">
      <span className="ir-reco-cover">
        {cover ? <img src={cover} alt="" loading="lazy" onError={() => setBroken(true)} /> : <span>{reco.title.slice(0, 1)}</span>}
      </span>
      <div className="ir-reco-body">
        <strong>{reco.title}</strong>
        <span className="ir-reco-meta">{[reco.category, reco.year].filter(Boolean).join(' · ')}</span>
        <p className={open ? 'is-open' : ''}>{reco.reason}</p>
        {long && (
          <button type="button" className="ir-more" onClick={() => setOpen(v => !v)}>
            {open ? labels.readLess : labels.readMore}
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * Chat de follow-up sobre a análise. Cada pergunta consome 1 do orçamento diário
 * de mensagens de IA (15/dia, reseta às 6h), o mesmo de gerar análise.
 */
function InsightChat({ insightId, initialChat, dailyLimit, dailyRemaining, onResult }) {
  const { t } = useLanguage();
  const tr = t.insights.result;
  const [thread, setThread] = useState(() => initialChat);
  const [remaining, setRemaining] = useState(dailyRemaining);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  const canSend = remaining > 0 && !sending;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [thread, sending]);

  const submit = async (e) => {
    e?.preventDefault();
    const question = draft.trim();
    if (!question || !canSend) return;

    setDraft('');
    setError('');
    setSending(true);
    setThread((prev) => [...prev, { role: 'USER', content: question, at: new Date().toISOString() }]);
    setRemaining((r) => Math.max(0, r - 1));

    try {
      const data = await sendInsightChat(insightId, question);
      if (Array.isArray(data?.chat)) setThread(data.chat);
      if (typeof data?.dailyRemaining === 'number') setRemaining(data.dailyRemaining);
      onResult?.(data);
    } catch (err) {
      setThread((prev) => prev.slice(0, -1)); // desfaz a bolha otimista
      setRemaining((r) => Math.min(dailyLimit, r + 1));
      setDraft(question);
      setError(err?.response?.data?.message || tr.chatError);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="ir-chat insights-enter" style={{ '--d': '220ms' }}>
      <div className="ir-chat-head">
        <h2 className="ir-section">{tr.chatTitle}</h2>
        <InfoTip label={tr.chatHelpLabel} title={tr.chatTitle}>
          <span className="mr-infotip-text">{fmt(tr.chatHelp, { max: dailyLimit })}</span>
        </InfoTip>
        <span className="ir-chat-quota">
          {remaining > 0 ? fmt(tr.quota, { n: remaining, max: dailyLimit }) : tr.quotaOut}
        </span>
      </div>

      {(thread.length > 0 || sending) && (
        <div className="ir-chat-thread" ref={scrollRef}>
          {thread.map((m, i) => (
            <div key={i} className={`ir-msg ${m.role === 'USER' ? 'is-user' : 'is-ai'}`}>
              <div className="ir-bubble">{m.content}</div>
            </div>
          ))}
          {sending && (
            <div className="ir-msg is-ai">
              <div className="ir-bubble ir-typing"><span /><span /><span /></div>
            </div>
          )}
        </div>
      )}

      {error && <p className="ir-chat-error" role="alert">{error}</p>}

      {remaining > 0 ? (
        <form className="ir-chat-form" onSubmit={submit}>
          <input
            className="mr-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={tr.placeholder}
            maxLength={500}
            disabled={sending}
          />
          <button className="ir-send" type="submit" disabled={!canSend || !draft.trim()} aria-label={tr.send} title={tr.send}>
            <ArrowUp size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </form>
      ) : (
        <p className="ir-chat-hint">{fmt(tr.limitHint, { max: dailyLimit })}</p>
      )}
    </section>
  );
}
