import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedItems } from '../../shared/useUnifiedItems';
import './insights.css';

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function InsightsPanel() {
  const navigate = useNavigate();
  const { items, loading, error } = useUnifiedItems();

  const works = useMemo(
    () => (items || [])
      .map((it) => ({
        id: it.id,
        title: it.title,
        note: num(it.note),
        category: it.categoryName || 'Outros',
        timeMinutes: num(it.timeMinutes),
      }))
      .sort((a, b) => b.note - a.note),
    [items],
  );

  const categories = useMemo(
    () => ['Todos', ...Array.from(new Set(works.map((w) => w.category)))],
    [works],
  );

  const [category, setCategory] = useState('Todos');
  const [selectedIds, setSelectedIds] = useState(null); // null = tudo (default)

  const visible = useMemo(
    () => (category === 'Todos' ? works : works.filter((w) => w.category === category)),
    [works, category],
  );

  const effectiveSelected = useMemo(() => {
    if (selectedIds !== null) return selectedIds;
    return new Set(works.map((w) => w.id));
  }, [selectedIds, works]);

  const selectedWorks = useMemo(
    () => works.filter((w) => effectiveSelected.has(w.id)),
    [works, effectiveSelected],
  );

  const mutate = (fn) => {
    setSelectedIds((current) => {
      const base = current !== null ? new Set(current) : new Set(works.map((w) => w.id));
      fn(base);
      return base;
    });
  };

  const toggle = (id) => mutate((s) => (s.has(id) ? s.delete(id) : s.add(id)));
  const selectAllVisible = () => mutate((s) => visible.forEach((w) => s.add(w.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const generate = () => {
    if (selectedWorks.length === 0) return;
    navigate('/insights', {
      state: {
        workIds: selectedWorks.map((w) => w.id),
        preview: selectedWorks.slice(0, 8).map((w) => ({ title: w.title, note: w.note })),
      },
    });
  };

  if (loading) {
    return (
      <div className="mr-space-y-4">
        <div className="insights-skel" style={{ height: 40, width: 240 }} />
        <div className="insights-metrics">
          {[0, 1, 2].map((i) => <div key={i} className="insights-skel" style={{ height: 78 }} />)}
        </div>
        <div className="insights-skel" style={{ height: 320 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="insights-state-card">
        <div className="insights-state-emoji">⚠️</div>
        <div className="insights-state-title">Não foi possível carregar suas obras</div>
        <div className="insights-state-text">Recarregue a página e tente de novo.</div>
      </div>
    );
  }

  if (works.length === 0) {
    return (
      <div className="insights-state-card">
        <div className="insights-state-emoji">🤖</div>
        <div className="insights-state-title">Sem obras para analisar ainda</div>
        <div className="insights-state-text">
          Avalie algumas obras nos seus rankings e a IA monta seu perfil de consumo aqui.
        </div>
      </div>
    );
  }

  return (
    <div className="mr-space-y-6 insights-panel">
      <div className="mr-section-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="mr-section-title" style={{ fontSize: '1.4rem' }}>🤖 IA Insights</h1>
          <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            Selecione as obras que você quer analisar e gere seu perfil de consumo.
          </p>
        </div>
        <button
          type="button"
          className="mr-btn mr-btn-gold"
          onClick={generate}
          disabled={selectedWorks.length === 0}
        >
          ✨ Gerar Análise
        </button>
      </div>

      <div className="insights-metrics">
        <div className="insights-metric">
          <div className="insights-metric-label">Obras disponíveis</div>
          <div className="insights-metric-value">{visible.length}</div>
        </div>
        <div className="insights-metric insights-metric--accent">
          <div className="insights-metric-label">Selecionadas</div>
          <div className="insights-metric-value">{selectedWorks.length}</div>
        </div>
        <div className="insights-metric">
          <div className="insights-metric-label">Categoria</div>
          <div className="insights-metric-value" style={{ fontSize: '1.05rem' }}>{category}</div>
        </div>
      </div>

      <div className="mr-card">
        <div className="mr-card-body mr-space-y-4">
          <div className="insights-filters">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`mr-btn mr-btn-sm ${category === cat ? 'mr-btn-gold' : 'mr-btn-outline'}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
            <span className="insights-filter-sep" />
            <button type="button" className="mr-btn mr-btn-sm mr-btn-outline" onClick={selectAllVisible}>
              Selecionar tudo
            </button>
            <button type="button" className="mr-btn mr-btn-sm mr-btn-outline" onClick={clearSelection}>
              Limpar seleção
            </button>
          </div>

          <div className="insights-layout">
            <div className="insights-list">
              {visible.map((item, idx) => {
                const selected = effectiveSelected.has(item.id);
                const rankClass = idx === 0 ? 'top-1' : idx === 1 ? 'top-2' : idx === 2 ? 'top-3' : '';
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    className={`insights-row insights-enter ${selected ? 'is-selected' : ''}`}
                    style={{ '--d': `${Math.min(idx, 12) * 22}ms` }}
                    onClick={() => toggle(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggle(item.id);
                      }
                    }}
                  >
                    <span className="insights-check">{selected ? '✓' : ''}</span>
                    <span className={`insights-rank-num ${rankClass}`}>{idx + 1}</span>
                    <div className="insights-row-info">
                      <div className="insights-row-title">{item.title}</div>
                      <div className="insights-row-sub">{item.category}</div>
                    </div>
                    <span className="mr-badge mr-badge-gold">{item.note.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>

            <div className="insights-aside">
              <div className="mr-info-card-blue">
                <div className="mr-card-body">
                  <div className="insights-aside-head">
                    <div>
                      <div className="insights-metric-label">Seleção atual</div>
                      <div className="insights-aside-count">{selectedWorks.length} obras</div>
                    </div>
                    <span className="mr-badge mr-badge-green">{category}</span>
                  </div>
                  {selectedWorks.length === 0 ? (
                    <div className="insights-step-copy">Nenhuma obra selecionada.</div>
                  ) : (
                    <div className="insights-aside-list">
                      {selectedWorks.slice(0, 6).map((item) => (
                        <div key={item.id} className="insights-aside-item">
                          <span>{item.title}</span>
                          <span className="note">{item.note.toFixed(1)}</span>
                        </div>
                      ))}
                      {selectedWorks.length > 6 && (
                        <div className="insights-aside-more">
                          + {selectedWorks.length - 6} outras obras
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mr-info-card-gold">
                <div className="mr-card-body">
                  <div className="insights-metric-label" style={{ marginBottom: 8 }}>Como funciona</div>
                  <p className="insights-step-copy">
                    A IA analisa suas notas e monta um perfil de consumo com traços, gêneros
                    favoritos e uma recomendação. O resultado fica salvo — reabrir não gasta
                    uma nova geração.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
