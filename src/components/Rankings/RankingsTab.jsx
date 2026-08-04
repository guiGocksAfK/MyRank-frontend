import React, { useState, useEffect, useMemo } from 'react';
import UnifiedTable from './UnifiedTable';
import IndividualTable from './IndividualTable';
import TableSelector from './TableSelector';
import FilterPanel from './FilterPanel';
import NewTableModal from './NewTableModal';
import { getGroups, createGroup, updateGroup } from '../../services/masterTableGroupService';
import { getCategories, createCategory, deleteCategory } from '../../services/CategoryService.js';
import { getWorksByCategory, createWork, updateWork, deleteWork } from '../../services/WorkService.js';
import { mapWorkToItem, mapItemToWorkDTO, mapCategoryToTable } from '../../utils/mapWork';
import { applyFilters } from '../../utils/formatters';

export default function RankingsTab({ onNavigateToCreators }) {
  const [tables,           setTables]           = useState([]);
  const [loadingTables,    setLoadingTables]    = useState(true);
  const [loadError,        setLoadError]        = useState(null);
  const [activeTab,        setActiveTab]        = useState('unified');
  const [useTimeWeight,    setUseTimeWeight]    = useState(true);
  const [sortBy,           setSortBy]           = useState('nota');
  const [viewMode,         setViewMode]         = useState('list');
  const [showFilters,      setShowFilters]      = useState(false);
  const [filters,          setFilters]          = useState({});
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [showNewTable,     setShowNewTable]     = useState(false);
  const [unifiedGroupId,   setUnifiedGroupId]   = useState(null);

  // ── Carrega categorias + obras + grupo "Unificado" do backend ao montar ──
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoadingTables(true);
      setLoadError(null);
      try {
        const categories = await getCategories();
        const tablesWithItems = await Promise.all(
          categories.map(async (cat) => {
            const works = await getWorksByCategory(cat.id);
            return mapCategoryToTable(cat, works.map(mapWorkToItem));
          })
        );
        if (cancelled) return;
        setTables(tablesWithItems);

        // Busca o grupo "Unificado" já existente, ou cria um novo com tudo selecionado
        const groups = await getGroups();
        let unifiedGroup = groups.find(g => g.name === 'Unificado');

        if (!unifiedGroup && tablesWithItems.length > 0) {
          unifiedGroup = await createGroup('Unificado', tablesWithItems.map(t => t.id));
        }

        if (cancelled) return;

        if (unifiedGroup) {
          setUnifiedGroupId(unifiedGroup.id);
          setSelectedTableIds(unifiedGroup.categoryIds);
        } else {
          setSelectedTableIds(tablesWithItems.map(t => t.id));
        }
      } catch (err) {
        if (!cancelled) setLoadError(err?.response?.data?.message || err.message || 'Erro ao carregar suas tabelas.');
      } finally {
        if (!cancelled) setLoadingTables(false);
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, []);

  // ── Salvar obra (criar ou editar) ──
  async function handleSaveWork(categoryId, payload) {
    const dto = mapItemToWorkDTO(payload, categoryId);
    const saved = payload.id
      ? await updateWork(payload.id, dto)
      : await createWork(dto);
    const item = mapWorkToItem(saved);

    setTables(prev => prev.map(t => {
      if (t.id !== categoryId) return t;
      const exists = t.items.find(x => x.id === item.id);
      const newItems = exists ? t.items.map(x => x.id === item.id ? item : x) : [...t.items, item];
      return { ...t, items: newItems };
    }));
  }

  // ── Excluir obra ──
  async function handleDeleteWork(categoryId, workId) {
    await deleteWork(workId);
    setTables(prev => prev.map(t =>
      t.id === categoryId ? { ...t, items: t.items.filter(x => x.id !== workId) } : t
    ));
  }

  // ── Criar tabela (categoria) ──
  async function handleCreateTable(label) {
    const cat = await createCategory(label);
    const newTable = mapCategoryToTable(cat);
    setTables(prev => [...prev, newTable]);

    const newSelectedIds = [...selectedTableIds, newTable.id];
    setSelectedTableIds(newSelectedIds);
    setActiveTab(newTable.id);

    if (unifiedGroupId) {
      try {
        await updateGroup(unifiedGroupId, 'Unificado', newSelectedIds);
      } catch (err) {
        console.error('Erro ao atualizar grupo unificado:', err);
      }
    }
  }

  // ── Excluir tabela (categoria) ──
  async function handleDeleteTable(id) {
    await deleteCategory(id);
    setTables(prev => prev.filter(t => t.id !== id));
    setSelectedTableIds(prev => prev.filter(x => x !== id));
    setActiveTab('unified');
  }

  // ── Mudar seleção do Unificado (persiste no master_table_group) ──
  async function handleChangeSelectedTables(newIds) {
    setSelectedTableIds(newIds); // atualiza a UI na hora
    if (!unifiedGroupId) return;
    try {
      await updateGroup(unifiedGroupId, 'Unificado', newIds);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Erro ao salvar seleção de tabelas.');
    }
  }

  const filteredCount = useMemo(() => {
    if (activeTab === 'unified') {
      const selectedTables = tables.filter(t => selectedTableIds.includes(t.id));
      const allItems = selectedTables.flatMap(t => t.items);
      return applyFilters(allItems, filters).length;
    }
    const table = tables.find(t => t.id === activeTab);
    if (!table) return 0;
    return applyFilters(table.items, filters).length;
  }, [activeTab, tables, selectedTableIds, filters]);

  if (loadingTables) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--mr-text-secondary)' }}>⏳ Carregando suas tabelas...</div>;
  }

  if (loadError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#e24b4a' }}>
        ❌ {loadError}
      </div>
    );
  }

  return (
    <div className="mr-space-y-6">
      <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-4">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>🏆 Rankings</h1>
          <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            Compare e analise suas avaliações
          </p>
        </div>
        <div className="mr-flex mr-items-center mr-gap-3 mr-flex-wrap">
          {onNavigateToCreators && (
            <button className="mr-btn mr-btn-outline" onClick={onNavigateToCreators} title="Ver ranking de diretores, escritores e studios">
              ✨ Ver criadores →
            </button>
          )}
          <div style={{ width: 1, height: 24, background: 'var(--mr-border)' }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--mr-text-secondary)' }}>Ponderação por tempo</span>
          <button className={`mr-switch ${useTimeWeight ? 'checked' : ''}`} onClick={() => setUseTimeWeight(v => !v)}>
            <span className="mr-switch-thumb" />
          </button>
        </div>
      </div>

      <div className="mr-flex mr-items-center mr-gap-1 mr-flex-wrap" style={{ borderBottom: '1px solid var(--mr-border)', paddingBottom: 0 }}>
        <button className={`mr-tab-trigger ${activeTab === 'unified' ? 'active' : ''}`} onClick={() => setActiveTab('unified')} style={{ borderRadius: '8px 8px 0 0' }}>
          🏆 Unificado
        </button>
        {tables.map(t => (
          <button key={t.id} className={`mr-tab-trigger ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)} style={{ borderRadius: '8px 8px 0 0' }}>
            {t.label}
          </button>
        ))}
        <button className="mr-btn mr-btn-outline mr-btn-sm" style={{ marginLeft: 'auto', marginBottom: 2 }} onClick={() => setShowNewTable(true)}>
          ➕ Nova tabela
        </button>
      </div>

      <div className="mr-flex mr-items-center mr-gap-2 mr-flex-wrap">
        <div className="mr-flex mr-gap-2">
          <button className={`mr-btn mr-btn-sm ${sortBy === 'nota' ? 'mr-btn-gold' : 'mr-btn-outline'}`} onClick={() => setSortBy('nota')}>Notas</button>
          <button className={`mr-btn mr-btn-sm ${sortBy === 'time' ? 'mr-btn-gold' : 'mr-btn-outline'}`} onClick={() => setSortBy('time')}>Tempo</button>
        </div>
        <div style={{ width: 1, height: 24, background: 'var(--mr-border)' }} />
        <div className="mr-flex mr-gap-1">
          <button className={`mr-btn mr-btn-sm ${viewMode === 'list' ? 'mr-btn-gold' : 'mr-btn-outline'}`} onClick={() => setViewMode('list')} title="Visualização em lista">📋</button>
          <button className={`mr-btn mr-btn-sm ${viewMode === 'grid' ? 'mr-btn-gold' : 'mr-btn-outline'}`} onClick={() => setViewMode('grid')} title="Visualização em grid">🎞️</button>
        </div>
        <div style={{ width: 1, height: 24, background: 'var(--mr-border)' }} />
        <button className={`mr-btn mr-btn-sm ${showFilters ? 'mr-btn-gold' : 'mr-btn-outline'}`} onClick={() => setShowFilters(v => !v)}>
          🔎 Filtros {Object.keys(filters).length > 0 && '•'}
        </button>
      </div>

      {activeTab === 'unified' && (
        <TableSelector tables={tables} selectedIds={selectedTableIds} onChange={handleChangeSelectedTables} />
      )}

      {showFilters && (
        <FilterPanel filters={filters} onChange={setFilters} onClear={() => setFilters({})} resultCount={filteredCount} />
      )}

      {showNewTable && (
        <NewTableModal onSave={handleCreateTable} onClose={() => setShowNewTable(false)} />
      )}

      {activeTab === 'unified' ? (
        <UnifiedTable
          tables={tables}
          selectedTableIds={selectedTableIds}
          sortBy={sortBy}
          useTimeWeight={useTimeWeight}
          viewMode={viewMode}
          filters={filters}
        />
      ) : (
        (() => {
          const table = tables.find(t => t.id === activeTab);
          if (!table) return null;
          return (
            <IndividualTable
              table={table}
              sortBy={sortBy}
              useTimeWeight={useTimeWeight}
              viewMode={viewMode}
              filters={filters}
              onSaveWork={handleSaveWork}
              onDeleteWork={handleDeleteWork}
              onDeleteTable={handleDeleteTable}
            />
          );
        })()
      )}
    </div>
  );
}