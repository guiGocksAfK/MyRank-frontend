import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateInsights, getLatestInsights } from '../../services/insightsService';
import DashboardFooter from '../dashboard/DashboardFooter';
import { BAR_COLORS, relativeFromNow } from './aiInsightsHelpers';
import '../dashboard/dashboard.css';
import './insights.css';

export default function InsightsResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const workIds = useMemo(() => {
    const raw = location.state?.workIds;
    return Array.isArray(raw) ? raw : null;
  }, [location.state]);

  const [status, setStatus] = useState('loading'); // loading | ready | empty | error
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let active = true;
    setStatus('loading');

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
        setErrorMessage(
          err?.response?.data?.message
          || 'Não foi possível gerar a análise agora. Tente novamente em instantes.',
        );
        setStatus('error');
      });

    return () => { active = false; };
  }, [workIds]);

  const goBack = () => navigate('/dashboard', { state: { tab: 'ai' } });

  const regenerate = async () => {
    if (!workIds || regenerating) return;
    setRegenerating(true);
    setErrorMessage('');
    try {
      const data = await generateInsights(workIds, true);
      setResult(data);
      setStatus('ready');
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message
        || 'Não foi possível gerar de novo agora. Tente em instantes.',
      );
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="insights-result-page">
      <div className="insights-result-inner">
        <div className="insights-topbar">
          <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={goBack}>← IA Insights</button>
          <span className="insights-brand">My<span className="g">Rank</span></span>
        </div>

        {status === 'loading' && <LoadingView />}
        {status === 'empty' && <EmptyView onBack={goBack} />}
        {status === 'error' && (
          <ErrorView
            message={errorMessage}
            canRetry={Boolean(workIds)}
            retrying={regenerating}
            onRetry={regenerate}
            onBack={goBack}
          />
        )}
        {status === 'ready' && result && (
          <ReadyView
            result={result}
            canRegenerate={Boolean(workIds)}
            regenerating={regenerating}
            onRegenerate={regenerate}
          />
        )}
      </div>

      <DashboardFooter />
    </div>
  );
}

function ReadyView({ result, canRegenerate, regenerating, onRegenerate }) {
  const { analysis, model, workCount, cached, generatedAt } = result;
  const traits = Array.isArray(analysis.traits) ? analysis.traits : [];
  const taste = Array.isArray(analysis.tasteProfile) ? analysis.tasteProfile : [];
  const maxPercent = Math.max(1, ...taste.map((s) => s.percent || 0));
  const reco = analysis.recommendation;

  return (
    <>
      <section className="insights-hero insights-enter">
        <div className="mr-flex mr-justify-between mr-gap-4" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <span className="insights-hero-eyebrow">✨ Perfil de consumo</span>
            <h1 className="insights-hero-title">{analysis.summaryTitle}</h1>
            <p className="insights-hero-text">{analysis.summaryText}</p>
          </div>
        </div>

        <div className="insights-hero-meta">
          <span>{workCount} obras analisadas</span>
          <span className="dot">•</span>
          <span>{model}</span>
          {generatedAt && <><span className="dot">•</span><span>gerado {relativeFromNow(generatedAt)}</span></>}
          {cached && <><span className="dot">•</span><span>reaproveitado do cache</span></>}
        </div>

        {canRegenerate && (
          <div className="insights-hero-actions">
            <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onRegenerate} disabled={regenerating}>
              {regenerating ? 'Gerando…' : '↻ Gerar novamente'}
            </button>
          </div>
        )}
      </section>

      {traits.length > 0 && (
        <section className="insights-enter" style={{ '--d': '60ms' }}>
          <h2 className="insights-section-title">🧬 Seus traços</h2>
          <div className="insights-traits-grid">
            {traits.map((trait, i) => (
              <div key={`${trait.label}-${i}`} className="insights-trait">
                <div className="insights-trait-icon">{trait.icon || '•'}</div>
                <div className="insights-trait-label">{trait.label}</div>
                <div className="insights-trait-desc">{trait.description}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(taste.length > 0 || reco) && (
        <div className="insights-bottom-grid">
          {taste.length > 0 && (
            <section className="mr-card insights-enter" style={{ '--d': '120ms' }}>
              <div className="mr-card-body">
                <h2 className="insights-section-title">🎯 Perfil de gosto</h2>
                {taste.map((slice, i) => (
                  <div key={`${slice.name}-${i}`} className="insights-taste-row">
                    <div className="insights-taste-head">
                      <span>{slice.name}</span>
                      <span className="pct">{slice.percent}%</span>
                    </div>
                    <div className="mr-progress">
                      <div
                        className="mr-progress-bar"
                        style={{
                          width: `${Math.round(((slice.percent || 0) / maxPercent) * 100)}%`,
                          background: BAR_COLORS[i % BAR_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {reco && (
            <section className="insights-reco insights-enter" style={{ '--d': '180ms' }}>
              <span className="insights-hero-eyebrow">💡 Recomendação para você</span>
              <div className="insights-reco-title">{reco.title}</div>
              <div className="insights-reco-badges">
                {reco.year && <span className="mr-badge mr-badge-outline">{reco.year}</span>}
                {reco.category && <span className="mr-badge mr-badge-green">{reco.category}</span>}
                {typeof reco.compatPercent === 'number' && (
                  <span className="mr-badge mr-badge-gold">{reco.compatPercent}% compatível</span>
                )}
              </div>
              <p className="insights-reco-reason">{reco.reason}</p>
            </section>
          )}
        </div>
      )}
    </>
  );
}

function LoadingView() {
  return (
    <>
      <section className="insights-hero">
        <div className="insights-spinner" />
        <p style={{ textAlign: 'center', color: 'var(--mr-text-secondary)', marginTop: 12 }}>
          Analisando seu perfil de consumo…
        </p>
      </section>
      <div className="insights-traits-grid">
        {[0, 1, 2].map((i) => <div key={i} className="insights-skel" style={{ height: 130 }} />)}
      </div>
      <div className="insights-skel" style={{ height: 220 }} />
    </>
  );
}

function EmptyView({ onBack }) {
  return (
    <div className="insights-state-card">
      <div className="insights-state-emoji">🤖</div>
      <div className="insights-state-title">Nenhuma análise ainda</div>
      <div className="insights-state-text">
        Volte ao painel de IA Insights, selecione suas obras e gere sua primeira análise.
      </div>
      <div className="insights-state-actions">
        <button className="mr-btn mr-btn-gold" onClick={onBack}>Voltar ao IA Insights</button>
      </div>
    </div>
  );
}

function ErrorView({ message, canRetry, retrying, onRetry, onBack }) {
  return (
    <div className="insights-state-card">
      <div className="insights-state-emoji">⚠️</div>
      <div className="insights-state-title">Erro ao gerar a análise</div>
      <div className="insights-state-text">{message}</div>
      <div className="insights-state-actions">
        {canRetry && (
          <button className="mr-btn mr-btn-gold" onClick={onRetry} disabled={retrying}>
            {retrying ? 'Tentando…' : 'Tentar de novo'}
          </button>
        )}
        <button className="mr-btn mr-btn-outline" onClick={onBack}>Voltar ao IA Insights</button>
      </div>
    </div>
  );
}
