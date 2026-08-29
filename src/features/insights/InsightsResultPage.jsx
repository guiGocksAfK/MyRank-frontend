import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateInsights, getLatestInsights } from '../../services/insightsService';
import { BAR_COLORS, relativeFromNow } from './aiInsightsHelpers';
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

    const load = workIds
      ? generateInsights(workIds, false)
      : getLatestInsights();

    load
      .then((data) => {
        if (!active) return;
        if (!data) {
          setStatus('empty');
          return;
        }
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

  const handleBack = () => navigate('/dashboard');

  const handleRegenerate = async () => {
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

  if (status === 'loading') {
    return (
      <Shell onBack={handleBack}>
        <div className="mr-card">
          <div className="mr-card-body" style={{ textAlign: 'center', padding: 48 }}>
            <div className="insights-spinner" />
            <p style={{ color: 'var(--mr-text-secondary)', marginTop: 16 }}>
              Analisando seu perfil de consumo…
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  if (status === 'empty') {
    return (
      <Shell onBack={handleBack}>
        <div className="mr-card">
          <div className="mr-card-body" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🤖</div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Nenhuma análise ainda</h1>
            <p style={{ color: 'var(--mr-text-secondary)', marginBottom: 18 }}>
              Volte ao painel de IA Insights, selecione suas obras e gere sua primeira análise.
            </p>
            <button className="mr-btn mr-btn-gold" onClick={handleBack}>Voltar ao Dashboard</button>
          </div>
        </div>
      </Shell>
    );
  }

  if (status === 'error') {
    return (
      <Shell onBack={handleBack}>
        <div className="mr-card">
          <div className="mr-card-body" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Erro ao gerar a análise</h1>
            <p style={{ color: 'var(--mr-text-secondary)', marginBottom: 18 }}>{errorMessage}</p>
            <div className="mr-flex mr-gap-3" style={{ justifyContent: 'center' }}>
              {workIds && (
                <button className="mr-btn mr-btn-gold" onClick={handleRegenerate} disabled={regenerating}>
                  {regenerating ? 'Tentando…' : 'Tentar de novo'}
                </button>
              )}
              <button className="mr-btn mr-btn-outline" onClick={handleBack}>Voltar ao Dashboard</button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  const { analysis, model, workCount, cached, generatedAt } = result;
  const maxPercent = Math.max(1, ...(analysis.tasteProfile || []).map((s) => s.percent || 0));

  return (
    <Shell onBack={handleBack}>
      <div className="mr-card">
        <div className="mr-card-body mr-space-y-2">
          <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-4">
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', marginBottom: 6 }}>
                Perfil de consumo · {workCount} obras · {model}
                {cached ? ' · reaproveitado' : ''}
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{analysis.summaryTitle}</h1>
            </div>
            {workIds && (
              <button className="mr-btn mr-btn-outline" onClick={handleRegenerate} disabled={regenerating}>
                {regenerating ? 'Gerando…' : '↻ Gerar novamente'}
              </button>
            )}
          </div>
          <p style={{ color: 'var(--mr-text-secondary)', lineHeight: 1.7, maxWidth: 720 }}>
            {analysis.summaryText}
          </p>
          {generatedAt && (
            <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>
              Gerado {relativeFromNow(generatedAt)}
            </div>
          )}
        </div>
      </div>

      {Array.isArray(analysis.traits) && analysis.traits.length > 0 && (
        <div className="insights-traits-grid">
          {analysis.traits.map((trait, i) => (
            <div key={`${trait.label}-${i}`} className="mr-card">
              <div className="mr-card-body">
                <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{trait.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{trait.label}</div>
                <div style={{ color: 'var(--mr-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {trait.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {Array.isArray(analysis.tasteProfile) && analysis.tasteProfile.length > 0 && (
        <div className="mr-card">
          <div className="mr-card-body mr-space-y-3">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Perfil de gosto</h2>
            <div className="mr-space-y-3">
              {analysis.tasteProfile.map((slice, i) => (
                <div key={`${slice.name}-${i}`}>
                  <div className="mr-flex mr-justify-between" style={{ fontSize: '0.9rem', marginBottom: 4 }}>
                    <span>{slice.name}</span>
                    <span style={{ color: 'var(--mr-text-secondary)' }}>{slice.percent}%</span>
                  </div>
                  <div className="insights-bar-track">
                    <div
                      className="insights-bar-fill"
                      style={{
                        width: `${Math.round(((slice.percent || 0) / maxPercent) * 100)}%`,
                        background: BAR_COLORS[i % BAR_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {analysis.recommendation && (
        <div className="mr-info-card-gold">
          <div className="mr-card-body mr-space-y-2">
            <div className="insights-summary-label">Recomendação para você</div>
            <div className="mr-flex mr-items-center mr-gap-3 mr-flex-wrap">
              <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{analysis.recommendation.title}</span>
              {analysis.recommendation.year && (
                <span className="mr-badge mr-badge-outline">{analysis.recommendation.year}</span>
              )}
              {analysis.recommendation.category && (
                <span className="mr-badge mr-badge-green">{analysis.recommendation.category}</span>
              )}
              {typeof analysis.recommendation.compatPercent === 'number' && (
                <span className="mr-badge mr-badge-gold">{analysis.recommendation.compatPercent}% compatível</span>
              )}
            </div>
            <p style={{ color: 'var(--mr-text)', lineHeight: 1.7 }}>{analysis.recommendation.reason}</p>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children, onBack }) {
  return (
    <div className="myrank-dashboard">
      <div className="mr-main mr-space-y-6" style={{ paddingTop: 24 }}>
        <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onBack}>← Voltar ao Dashboard</button>
        {children}
      </div>
    </div>
  );
}
