import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './insights.css';

const USER_RANKINGS = [
  { title: 'The Witcher 3', note: 9.8, category: 'Jogo', timeMinutes: 6000 },
  { title: 'Red Dead Redemption 2', note: 9.7, category: 'Jogo', timeMinutes: 5400 },
  { title: 'Breaking Bad', note: 9.5, category: 'Série', timeMinutes: 3120 },
  { title: 'Interstellar', note: 9.2, category: 'Filme', timeMinutes: 169 },
  { title: 'Duna: Parte Dois', note: 8.9, category: 'Filme', timeMinutes: 166 },
  { title: 'Elden Ring', note: 8.8, category: 'Jogo', timeMinutes: 7200 },
  { title: 'Dune (livro)', note: 8.7, category: 'Livro', timeMinutes: 1260 },
  { title: 'The Last of Us', note: 8.6, category: 'Série', timeMinutes: 540 },
  { title: 'Arrival', note: 8.4, category: 'Filme', timeMinutes: 116 },
  { title: 'Dark', note: 8.2, category: 'Série', timeMinutes: 1380 },
];

const ALL_CATEGORIES = ['Todos', ...Array.from(new Set(USER_RANKINGS.map((item) => item.category)))];

export default function InsightsPanel() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('Todos');
  const [selectedItems, setSelectedItems] = useState(USER_RANKINGS);

  const filteredRankings = useMemo(
    () => (category === 'Todos'
      ? USER_RANKINGS
      : USER_RANKINGS.filter((item) => item.category === category)),
    [category],
  );

  const selectedTitles = useMemo(
    () => new Set(selectedItems.map((item) => item.title)),
    [selectedItems],
  );

  const toggleItem = (item) => {
    setSelectedItems((current) => {
      const exists = current.some((selected) => selected.title === item.title);
      if (exists) {
        return current.filter((selected) => selected.title !== item.title);
      }
      return [...current, item];
    });
  };

  const selectAll = () => setSelectedItems(filteredRankings);
  const clearSelection = () => setSelectedItems([]);

  const generateAnalysisPage = () => {
    if (selectedItems.length === 0) return;
    navigate('/insights', { state: { selectedItems, category } });
  };

  return (
    <div className="mr-space-y-6 insights-panel">
      <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-4">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--mr-text)' }}>🤖 IA Insights</h1>
          <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.95rem', marginTop: 4 }}>
            Selecione as obras que você quer analisar e vá para a página de resultados.
          </p>
        </div>
        <button
          type="button"
          className="mr-btn mr-btn-gold"
          onClick={generateAnalysisPage}
          disabled={selectedItems.length === 0}
        >
          ✨ Gerar Análise
        </button>
      </div>

      <div className="mr-card">
        <div className="mr-card-body mr-space-y-4">
          <div className="mr-flex mr-items-center mr-gap-3 mr-flex-wrap">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`mr-btn mr-btn-sm ${category === cat ? 'mr-btn-gold' : 'mr-btn-outline'}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
            <button type="button" className="mr-btn mr-btn-sm mr-btn-outline" onClick={selectAll}>
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
                  <div className="insights-summary-label">
                    Obras disponíveis
                  </div>
                  <div className="insights-summary-value">{filteredRankings.length}</div>
                </div>
                <div className="insights-summary insights-summary--selected">
                  <div>
                    <div className="insights-summary-label">Selecionadas</div>
                    <div className="insights-summary-value">{selectedItems.length}</div>
                  </div>
                </div>
              </div>

              <div className="mr-space-y-2 insights-ranking-list">
                {filteredRankings.map((item) => {
                  const selected = selectedTitles.has(item.title);
                  return (
                    <div
                      key={item.title}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleItem(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          toggleItem(item);
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
                        {filteredRankings.indexOf(item) + 1}
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
                      <div className="insights-selection-count">{selectedItems.length} obras</div>
                    </div>
                    <div className="mr-badge mr-badge-green">{category}</div>
                  </div>
                  <div className="mr-space-y-2">
                    {selectedItems.slice(0, 5).map((item) => (
                      <div key={item.title} className="insights-selection-item">
                        <span>{item.title}</span>
                        <span className="insights-selection-note">{item.note.toFixed(1)}</span>
                      </div>
                    ))}
                    {selectedItems.length > 5 && (
                      <div className="insights-selection-more">
                        + {selectedItems.length - 5} outras obras selecionadas
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mr-info-card-gold">
                <div className="mr-card-body">
                  <div className="insights-summary-label insights-step-label">Último passo</div>
                  <p className="insights-step-copy">
                    Clique em gerar análise para abrir a página separada de insights com base na sua seleção.
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
