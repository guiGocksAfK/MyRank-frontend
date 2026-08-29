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
  // ids selecionados; null enquanto não carregou (aí selecionamos tudo por padrão)
  const [selectedIds, setSelectedIds] = useState(null);

  const visible = useMemo(
    () => (category === 'Todos' ? works : works.filter((w) => w.category === category)),
    [works, category],
  );

  const effectiveSelected = useMemo(() => {
    if (selectedIds !== null) return selectedIds;
    return new Set(works.map((w) => w.id)); // default: tudo
  }, [selectedIds, works]);

  const selectedWorks = useMemo(
    () => works.filter((w) => effectiveSelected.has(w.id)),
    [works, effectiveSelected],
  );

  const toggle = (id) => {
    setSelectedIds((current) => {
      const base = current !== null ? new Set(current) : new Set(works.map((w) => w.id));
      if (base.has(id)) base.delete(id);
      else base.add(id);
      return base;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds((current) => {
      const base = current !== null ? new Set(current) : new Set(works.map((w) => w.id));
      visible.forEach((w) => base.add(w.id));
      return base;
    });
  };

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
    return <div className="mr-card"><div className="mr-card-body">Carregando suas obras…</div></div>;
  }

  if (error) {
    return (
      <div className="mr-card">
        <div className="mr-card-body">Não foi possível carregar suas obras. Recarregue a página.</div>
      </div>
    );
  }

  if (works.length === 0) {
    return (
      <div className="mr-card">
        <div className="mr-card-body mr-space-y-2">
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>🤖 IA Insights</h1>
          <p style={{ color: 'var(--mr-text-secondary)' }}>
            Você ainda não avaliou nenhuma obra. Adicione algumas nos seus rankings e volte aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mr-space-y-6 insights-panel">
      <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-4">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--mr-text)' }}>🤖 IA Insights</h1>
          <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.95rem', marginTop: 4 }}>
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

      <div className="mr-card">
        <div className="mr-card-body mr-space-y-4">
          <div className="mr-flex mr-items-center mr-gap-3 mr-flex-wrap">
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
            <button type="button" className="mr-btn mr-btn-sm mr-btn-outline" onClick={selectAllVisible}>
              Selecionar tudo
            </button>
            <button type="button" className="mr-btn mr-btn-sm mr-btn-outline" onClick={clearSelection}>
              Limpar seleção
            </button>
          </div>

          <div className="insights-layout">
            <div>
              <div className="insights-summary">
                <div>
                  <div className="insights-summary-label">Obras disponíveis</div>
                  <div className="insights-summary-value">{visible.length}</div>
                </div>
                <div className="insights-summary insights-summary--selected">
                  <div>
                    <div className="insights-summary-label">Selecionadas</div>
                    <div className="insights-summary-value">{selectedWorks.length}</div>
                  </div>
                </div>
              </div>

              <div className="mr-space-y-2 insights-ranking-list">
                {visible.map((item, idx) => {
                  const selected = effectiveSelected.has(item.id);
                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggle(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          toggle(item.id);
                        }
                      }}
                      className="mr-rank-item"
                      style={{
                        width: '100%',
                        cursor: 'pointer',
                        background: selected ? 'rgba(212, 175, 55, 0.14)' : 'transparent',
                        border: '1px solid',
                        borderColor: selected ? 'rgba(212, 175, 55, 0.35)' : 'var(--mr-border)',
                        color: 'var(--mr-text)',
                      }}
                    >
                      <div className={`mr-rank-number ${selected ? 'mr-rank-number-1' : ''}`}>
                        {idx + 1}
                      </div>
                      <div className="mr-rank-info">
                        <div className="mr-rank-title" style={{ color: 'var(--mr-text)' }}>{item.title}</div>
                        <div className="mr-rank-subtitle" style={{ color: 'var(--mr-text-secondary)' }}>{item.category}</div>
                      </div>
                      <div className="mr-rank-note-area">
                        <span className="mr-badge mr-badge-gold">{item.note.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="insights-side-column">
              <div className="mr-info-card-blue">
                <div className="mr-card-body">
                  <div className="insights-selection-header">
                    <div>
                      <div className="insights-summary-label">Seleção atual</div>
                      <div className="insights-selection-count">{selectedWorks.length} obras</div>
                    </div>
                    <div className="mr-badge mr-badge-green">{category}</div>
                  </div>
                  <div className="mr-space-y-2">
                    {selectedWorks.slice(0, 5).map((item) => (
                      <div key={item.id} className="insights-selection-item">
                        <span>{item.title}</span>
                        <span className="insights-selection-note">{item.note.toFixed(1)}</span>
                      </div>
                    ))}
                    {selectedWorks.length > 5 && (
                      <div className="insights-selection-more">
                        + {selectedWorks.length - 5} outras obras selecionadas
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mr-info-card-gold">
                <div className="mr-card-body">
                  <div className="insights-summary-label insights-step-label">Último passo</div>
                  <p className="insights-step-copy">
                    Clique em gerar análise para abrir a página de resultados com base na sua seleção.
                    O resultado fica salvo — reabrir não gasta uma nova geração.
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
