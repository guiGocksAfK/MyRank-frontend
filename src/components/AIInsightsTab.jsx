import React, { useState, useCallback } from 'react';

// ─── Dados do usuário que serão enviados para a IA ────────────────────────
// Em produção viriam de props ou context; aqui usamos os mesmos mocks do projeto
const USER_RANKINGS = [
  { title: 'The Witcher 3',           note: 9.8, category: 'Jogo',  timeMinutes: 6000 },
  { title: 'Red Dead Redemption 2',   note: 9.7, category: 'Jogo',  timeMinutes: 5400 },
  { title: 'Breaking Bad',            note: 9.5, category: 'Série', timeMinutes: 3120 },
  { title: 'Interstellar',            note: 9.2, category: 'Filme', timeMinutes: 169  },
  { title: 'Duna: Parte Dois',        note: 8.9, category: 'Filme', timeMinutes: 166  },
  { title: 'Elden Ring',              note: 8.8, category: 'Jogo',  timeMinutes: 7200 },
  { title: 'Dune (livro)',            note: 8.7, category: 'Livro', timeMinutes: 1260 },
  { title: 'The Last of Us',          note: 8.6, category: 'Série', timeMinutes: 540  },
  { title: 'Arrival',                 note: 8.4, category: 'Filme', timeMinutes: 116  },
  { title: 'Dark',                    note: 8.2, category: 'Série', timeMinutes: 1380 },
];

// ─── Prompt para a IA ─────────────────────────────────────────────────────
function buildPrompt(rankings) {
  const list = rankings
    .map((r, i) => `${i + 1}. "${r.title}" (${r.category}) — nota ${r.note}/10, tempo: ${r.timeMinutes}min`)
    .join('\n');

  return `Você é um analista de perfil de consumo de mídia. Analise o ranking pessoal deste usuário e responda APENAS com um objeto JSON válido, sem texto extra, sem markdown, sem backticks.

RANKING DO USUÁRIO:
${list}

Responda com este JSON exato (substitua os valores pelos seus):
{
  "summaryTitle": "título curto e personalizado do perfil (ex: 'O Explorador de Mundos Épicos')",
  "summaryText": "parágrafo de 2-3 frases descrevendo o perfil de consumo deste usuário com base nos dados",
  "traits": [
    {
      "icon": "emoji",
      "label": "nome do traço",
      "description": "frase curta explicando este traço de personalidade de consumidor"
    },
    {
      "icon": "emoji",
      "label": "nome do traço",
      "description": "frase curta explicando este traço de personalidade de consumidor"
    },
    {
      "icon": "emoji",
      "label": "nome do traço",
      "description": "frase curta explicando este traço de personalidade de consumidor"
    }
  ],
  "tasteProfile": [
    { "name": "categoria/gênero", "percent": 0 },
    { "name": "categoria/gênero", "percent": 0 },
    { "name": "categoria/gênero", "percent": 0 },
    { "name": "categoria/gênero", "percent": 0 },
    { "name": "categoria/gênero", "percent": 0 }
  ],
  "recommendation": {
    "title": "título da obra recomendada",
    "year": 2000,
    "category": "Filme/Série/Jogo/Livro",
    "compatPercent": 0,
    "reason": "2 frases explicando por que esta obra foi recomendada com base no perfil acima"
  }
}

Regras:
- tasteProfile: 5 gêneros/categorias com percent de 0-100 baseados no perfil real do usuário
- recommendation: uma obra que o usuário provavelmente ainda não viu/jogou, com compatPercent entre 70-99
- Responda SOMENTE o JSON, nada mais.`;
}

// ─── Paleta de cores para as barras de gosto ─────────────────────────────
const BAR_COLORS = [
  'var(--mr-gold)',
  'var(--mr-blue-light)',
  'var(--mr-green)',
  'var(--mr-purple)',
  '#e24b4a',
];

// ─── Skeleton de loading ──────────────────────────────────────────────────
function Skeleton({ width = '100%', height = 16, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: 6,
      background: 'var(--mr-surface)',
      border: '1px solid var(--mr-border)',
      animation: 'mr-pulse 1.4s ease-in-out infinite',
      ...style,
    }} />
  );
}

function AnalysisSkeleton() {
  return (
    <div className="mr-space-y-6">
      {/* Personality card skeleton */}
      <div className="mr-info-card-gold">
        <div className="mr-card-body mr-space-y-4">
          <div className="mr-flex mr-items-center mr-gap-3">
            <Skeleton width={48} height={48} style={{ borderRadius: '50%' }} />
            <div style={{ flex: 1 }} className="mr-space-y-2">
              <Skeleton width="60%" height={20} />
              <Skeleton width="90%" height={14} />
            </div>
          </div>
          <Skeleton height={14} />
          <Skeleton height={14} width="85%" />
          <Skeleton height={14} width="70%" />
          <div className="mr-grid-3col">
            {[1, 2, 3].map(i => (
              <div className="mr-card" key={i}>
                <div className="mr-card-body mr-space-y-2">
                  <Skeleton width={40} height={40} style={{ borderRadius: '50%', margin: '0 auto' }} />
                  <Skeleton height={14} width="80%" style={{ margin: '0 auto' }} />
                  <Skeleton height={12} />
                  <Skeleton height={12} width="75%" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Taste profile skeleton */}
      <div className="mr-card">
        <div className="mr-card-body mr-space-y-4">
          <Skeleton height={20} width="40%" />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="mr-space-y-2">
              <div className="mr-flex mr-justify-between">
                <Skeleton height={13} width="30%" />
                <Skeleton height={13} width="8%" />
              </div>
              <div className="mr-progress">
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${40 + i * 8}%`,
                  background: 'var(--mr-surface)',
                  border: '1px solid var(--mr-border)',
                  animation: 'mr-pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation skeleton */}
      <div className="mr-info-card-green">
        <div className="mr-card-body">
          <div className="mr-flex mr-items-start mr-gap-4">
            <div style={{ flex: 1 }} className="mr-space-y-3">
              <Skeleton height={20} width="50%" />
              <Skeleton height={26} width="40%" />
              <Skeleton height={14} />
              <Skeleton height={14} width="90%" />
              <Skeleton height={14} width="75%" />
            </div>
            <Skeleton width={80} height={80} style={{ borderRadius: '50%', flexShrink: 0 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Círculo de compatibilidade ───────────────────────────────────────────
function CompatCircle({ percent, color = 'var(--mr-green)' }) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const filled = (percent / 100) * circumference;

  return (
    <div className="mr-compat-circle">
      <svg viewBox="0 0 80 80">
        <circle className="mr-compat-circle-bg" cx="40" cy="40" r={radius} />
        <circle
          className="mr-compat-circle-fill"
          cx="40" cy="40" r={radius}
          strokeDasharray={`${filled} ${circumference}`}
          style={{ stroke: color }}
        />
      </svg>
      <div className="mr-compat-value" style={{ color }}>
        {percent}%
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────
export default function AIInsightsTab() {
  const [status,   setStatus]   = useState('idle');   // 'idle' | 'loading' | 'done' | 'error'
  const [analysis, setAnalysis] = useState(null);
  const [toast,    setToast]    = useState(false);

  const runAnalysis = useCallback(async () => {
    setStatus('loading');
    setAnalysis(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [
            { role: 'user', content: buildPrompt(USER_RANKINGS) }
          ],
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const raw  = data.content?.map(b => b.text ?? '').join('').trim() ?? '';

      // Remove possíveis backticks defensivamente
      const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(clean);

      setAnalysis(parsed);
      setStatus('done');

      // Toast de notificação (RNF-008)
      setToast(true);
      setTimeout(() => setToast(false), 3500);
    } catch (err) {
      console.error('IA Insights error:', err);
      setStatus('error');
    }
  }, []);

  const isLoading = status === 'loading';

  return (
    <div className="mr-space-y-6" style={{ position: 'relative' }}>

      {/* ── Toast de notificação (RNF-008) ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          background: 'var(--mr-surface)',
          border: '1px solid var(--mr-gold)',
          borderRadius: 10, padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: '0.875rem', fontWeight: 600,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          animation: 'mr-fade-in 0.3s ease',
        }}>
          <span style={{ color: 'var(--mr-gold)' }}>✓</span>
          Análise atualizada com sucesso
        </div>
      )}

      {/* ── Header ── */}
      <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-4">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>🤖 IA Insights</h1>
          <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            Análise do seu perfil gerada por inteligência artificial
          </p>
        </div>

        <div className="mr-flex mr-items-center mr-gap-3">
          {/* Indicador de status assíncrono (RNF-008) */}
          {isLoading && (
            <div className="mr-flex mr-items-center mr-gap-2" style={{
              fontSize: '0.8125rem', color: 'var(--mr-text-secondary)',
            }}>
              <span style={{ animation: 'mr-spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
              Analisando em segundo plano...
            </div>
          )}

          <button
            className="mr-btn mr-btn-gold"
            onClick={runAnalysis}
            disabled={isLoading}
          >
            {isLoading ? '⏳ Gerando...' : status === 'done' ? '🔄 Regenerar' : '✨ Gerar Análise'}
          </button>
        </div>
      </div>

      {/* ── Estado inicial (idle) ── */}
      {status === 'idle' && (
        <div className="mr-card">
          <div className="mr-card-body" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🤖</div>
            <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: 8 }}>
              Pronto para analisar seu perfil
            </div>
            <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem', maxWidth: 420, margin: '0 auto 24px' }}>
              A IA vai ler seus rankings, identificar padrões de gosto e gerar uma análise
              personalizada — incluindo uma recomendação da próxima obra ideal para você.
            </p>

            {/* Resumo do que será analisado */}
            <div className="mr-card" style={{ maxWidth: 360, margin: '0 auto 24px', textAlign: 'left' }}>
              <div className="mr-card-body mr-space-y-2">
                <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  O que será analisado
                </div>
                {USER_RANKINGS.slice(0, 5).map((r, i) => (
                  <div key={i} className="mr-flex mr-items-center mr-gap-3">
                    <span style={{
                      fontWeight: 700, color: i < 3 ? 'var(--mr-gold)' : 'var(--mr-text-muted)',
                      minWidth: 20, fontSize: '0.875rem',
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '0.875rem', flex: 1 }}>{r.title}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>
                      {r.note.toFixed(1)}
                    </span>
                  </div>
                ))}
                <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)', marginTop: 4, textAlign: 'center' }}>
                  + {USER_RANKINGS.length - 5} outras obras
                </div>
              </div>
            </div>

            <button className="mr-btn mr-btn-gold" onClick={runAnalysis}>
              ✨ Gerar Análise
            </button>
          </div>
        </div>
      )}

      {/* ── Loading skeleton (RNF-008 — UI não trava) ── */}
      {isLoading && <AnalysisSkeleton />}

      {/* ── Erro ── */}
      {status === 'error' && (
        <div className="mr-card">
          <div className="mr-card-body" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Erro ao gerar análise</div>
            <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>
              Não foi possível conectar à API. Verifique sua conexão e tente novamente.
            </p>
            <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={runAnalysis}>
              🔄 Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* ── Resultado ── */}
      {status === 'done' && analysis && (
        <>
          {/* ─ Análise de Personalidade ─ */}
          <div className="mr-info-card-gold">
            <div className="mr-card-body mr-space-y-4">
              <div className="mr-flex mr-items-center mr-gap-3">
                <span style={{ fontSize: '2rem' }}>🧠</span>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                    {analysis.summaryTitle}
                  </h3>
                  <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
                    Análise de Personalidade
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '0.9375rem', lineHeight: 1.7 }}>
                {analysis.summaryText}
              </p>

              <div className="mr-grid-3col">
                {(analysis.traits ?? []).map((trait, i) => (
                  <div className="mr-card" key={i}>
                    <div className="mr-card-body mr-text-center">
                      <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: 8 }}>
                        {trait.icon}
                      </span>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>
                        {trait.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', lineHeight: 1.4 }}>
                        {trait.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─ Perfil de Gosto ─ */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>📊 Perfil de Gosto</h3>
              <div className="mr-space-y-3">
                {(analysis.tasteProfile ?? []).map((cat, i) => (
                  <div key={cat.name}>
                    <div
                      className="mr-flex mr-justify-between mr-mb-2"
                      style={{ fontSize: '0.875rem' }}
                    >
                      <span>{cat.name}</span>
                      <span style={{ fontWeight: 600, color: BAR_COLORS[i] ?? 'var(--mr-gold)' }}>
                        {cat.percent}%
                      </span>
                    </div>
                    <div className="mr-progress">
                      <div
                        className="mr-progress-bar"
                        style={{
                          width: `${cat.percent}%`,
                          backgroundColor: BAR_COLORS[i] ?? 'var(--mr-gold)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─ Próxima Recomendação ─ */}
          {analysis.recommendation && (
            <div className="mr-info-card-green">
              <div className="mr-card-body">
                <div className="mr-flex mr-items-start mr-gap-4">
                  <div className="mr-flex-1">
                    <h3 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: 8 }}>
                      🎯 Próxima Recomendação
                    </h3>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--mr-green)', marginBottom: 4 }}>
                      {analysis.recommendation.title}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <span className="mr-badge mr-badge-outline" style={{ fontSize: '0.7rem' }}>
                        {analysis.recommendation.category}
                      </span>
                      {analysis.recommendation.year && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)', marginLeft: 8 }}>
                          {analysis.recommendation.year}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--mr-text-secondary)', lineHeight: 1.6 }}>
                      {analysis.recommendation.reason}
                    </p>
                  </div>

                  <CompatCircle percent={analysis.recommendation.compatPercent} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}