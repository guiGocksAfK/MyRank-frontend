import { useState, useEffect } from 'react';
import { ArrowRight, ArrowUpDown, LayoutGrid, List, Plus, SlidersHorizontal, Users } from 'lucide-react';
import UnifiedTable from './UnifiedTable';
import IndividualTable from './IndividualTable';
import FilterPanel from './FilterPanel';
import NewTableModal from './NewTableModal';
import { getGroups, createGroup, updateGroup, updateGroupOrder } from '../../../services/masterTableGroupService';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  createSubcategory, renameSubcategory, deleteSubcategory, updateCustomFields,
} from '../../../services/CategoryService.js';
import { getWorksByCategory, createWork, updateWork, deleteWork } from '../../../services/WorkService.js';
import { mapWorkToItem, mapItemToWorkDTO, mapCategoryToTable } from '../../../utils/mapWork';
import { activeFilterCount, getMode } from '../../../utils/formatters';
import { useBadges } from '../../../shared/badges';
import { useWorks } from '../../../shared/worksContext';
import { useLanguage } from '../../../shared/i18n';
import { tableName } from '../../../shared/tableTemplates';
import './rankings.css';
import { useUser } from '../../../shared/userContext';

const ORDERS = [
  { mode: 'simple', label: 'sortScores', sortBy: 'nota', weight: false },
  { mode: 'weight', label: 'sortWeighted', sortBy: 'nota', weight: true },
  { mode: 'time', label: 'sortTime', sortBy: 'time', weight: false },
];

function getTableOrderKey() {
  const userKey = localStorage.getItem('myrank_username') || 'anonymous';
  return `myrank_table_order_${userKey}`;
}

function orderTables(nextTables) {
  let parsedOrder;
  try {
    parsedOrder = JSON.parse(localStorage.getItem(getTableOrderKey()) || '[]');
  } catch {
    parsedOrder = [];
  }
  const savedIds = Array.isArray(parsedOrder) ? parsedOrder : [];

  const tableById = new Map(nextTables.map(table => [String(table.id), table]));
  const ordered = savedIds
    .map(id => tableById.get(String(id)))
    .filter(Boolean);
  const orderedIds = new Set(ordered.map(table => String(table.id)));

  return [...ordered, ...nextTables.filter(table => !orderedIds.has(String(table.id)))];
}

function saveTableOrder(nextTables) {
  localStorage.setItem(getTableOrderKey(), JSON.stringify(nextTables.map(table => table.id)));
}

function getItemOrderKey(tableId) {
  const userKey = localStorage.getItem('myrank_username') || 'anonymous';
  return `myrank_item_order_${userKey}_${tableId}`;
}

function orderItems(tableId, items) {
  let parsedOrder;
  try {
    parsedOrder = JSON.parse(localStorage.getItem(getItemOrderKey(tableId)) || '[]');
  } catch {
    parsedOrder = [];
  }
  const savedIds = Array.isArray(parsedOrder) ? parsedOrder : [];
  const itemById = new Map(items.map(item => [String(item.id), item]));
  const ordered = savedIds.map(id => itemById.get(String(id))).filter(Boolean);
  const orderedIds = new Set(ordered.map(item => String(item.id)));
  return [...ordered, ...items.filter(item => !orderedIds.has(String(item.id)))];
}

function saveItemOrder(tableId, items) {
  localStorage.setItem(getItemOrderKey(tableId), JSON.stringify(items.map(item => item.id)));
}

export default function RankingsTab({ onNavigateToCreators }) {
  const { refresh: refreshBadges } = useBadges();
  const { bumpWorks } = useWorks();
  const { t } = useLanguage();
  const tr = t.rankings;
  const [tables,           setTables]           = useState([]);
  const [loadingTableIds,  setLoadingTableIds]  = useState([]);
  const [loadError,        setLoadError]        = useState(null);
  // tabelas cujas obras não carregaram: as outras seguem funcionando
  const [failedTableIds,   setFailedTableIds]   = useState([]);
  const [reloadKey,        setReloadKey]        = useState(0);
  const [activeTab,        setActiveTab]        = useState('unified');
  const [useTimeWeight,    setUseTimeWeight]    = useState(false);
  const [sortBy,           setSortBy]           = useState('nota');
  // "nota ponderada ligada por padrão" (Configurações): abre em "Ponderada" quando ligado
  const { user } = useUser();
  const weightedDefault = Boolean(user?.weightedByDefault);
  const [seenWeightedDefault, setSeenWeightedDefault] = useState(false);
  if (weightedDefault !== seenWeightedDefault) {
    setSeenWeightedDefault(weightedDefault);
    setSortBy('nota');
    setUseTimeWeight(weightedDefault);
  }
  const [viewMode,         setViewMode]         = useState('list');
  // "visualização padrão" (Configurações): abre em lista ou grade
  const viewDefault = user?.rankingsView === 'GRID' ? 'grid' : 'list';
  const [seenViewDefault, setSeenViewDefault] = useState('list');
  if (viewDefault !== seenViewDefault) {
    setSeenViewDefault(viewDefault);
    setViewMode(viewDefault);
  }
  const [showFilters,      setShowFilters]      = useState(false);
  const [filters,          setFilters]          = useState({});
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [showNewTable,     setShowNewTable]     = useState(false);
  const [unifiedGroupId,   setUnifiedGroupId]   = useState(null);
  const [unifiedOrder,     setUnifiedOrder]     = useState([]);
  const [draggedTableId,   setDraggedTableId]   = useState(null);
  const [reordering,       setReordering]       = useState(false);

  // ── Carrega categorias + obras + grupo "Unificado" do backend ao montar ──
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoadError(null);
      setFailedTableIds([]);
      try {
        const categories = await getCategories();
        const tablesWithoutItems = categories.map(cat => mapCategoryToTable(cat));
        if (cancelled) return;
        setTables(orderTables(tablesWithoutItems));
        setSelectedTableIds(tablesWithoutItems.map(table => table.id));
        setLoadingTableIds(tablesWithoutItems.map(table => table.id));

        await Promise.all(tablesWithoutItems.map(async table => {
          try {
            const works = await getWorksByCategory(table.id);
            if (!cancelled) {
              setTables(prev => prev.map(current => current.id === table.id
                ? { ...current, items: orderItems(table.id, works.map(mapWorkToItem)) }
                : current));
            }
          } catch {
            // só esta tabela falhou: marca e segue, em vez de derrubar a aba inteira
            if (!cancelled) setFailedTableIds(prev => [...prev, table.id]);
          } finally {
            if (!cancelled) {
              setLoadingTableIds(prev => prev.filter(id => id !== table.id));
            }
          }
        }));

        if (cancelled) return;

        // Busca o grupo "Unificado" já existente, ou cria um novo com tudo selecionado
        const groups = await getGroups();
        let unifiedGroup = groups.find(g => g.name === 'Unificado');

        if (!unifiedGroup && tablesWithoutItems.length > 0) {
          unifiedGroup = await createGroup('Unificado', tablesWithoutItems.map(t => t.id));
        }

        if (cancelled) return;

        if (unifiedGroup) {
          setUnifiedGroupId(unifiedGroup.id);
          setSelectedTableIds(unifiedGroup.categoryIds);
          setUnifiedOrder(unifiedGroup.manualOrder || []);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err?.response?.data?.message || err.message || tr.loadError);
      }
    }

    loadAll();
    return () => { cancelled = true; };
    // tr.loadError fica de fora: trocar o idioma não deve recarregar tudo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

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
      saveItemOrder(categoryId, newItems);
      return { ...t, items: newItems };
    }));

    refreshBadges(); // pode ter desbloqueado badge → dispara o toast
    bumpWorks();     // Home / rodapé / perfil re-buscam as obras
  }

  // ── Excluir obra ──
  async function handleDeleteWork(categoryId, workId) {
    await deleteWork(workId);
    setTables(prev => prev.map(t => {
      if (t.id !== categoryId) return t;
      const nextItems = t.items.filter(x => x.id !== workId);
      saveItemOrder(categoryId, nextItems);
      return { ...t, items: nextItems };
    }));

    refreshBadges();
    bumpWorks();
  }

  function handleMoveItem(tableId, itemId, targetId) {
    setTables(prev => prev.map(table => {
      if (table.id !== tableId) return table;
      const itemIndex = table.items.findIndex(item => item.id === itemId);
      const targetIndex = table.items.findIndex(item => item.id === targetId);
      if (itemIndex < 0 || targetIndex < 0 || itemIndex === targetIndex) return table;

      const nextItems = [...table.items];
      const [draggedItem] = nextItems.splice(itemIndex, 1);
      const targetPosition = nextItems.findIndex(item => item.id === targetId);
      const insertIndex = itemIndex < targetIndex ? targetPosition + 1 : targetPosition;
      nextItems.splice(insertIndex, 0, draggedItem);
      saveItemOrder(tableId, nextItems);
      return { ...table, items: nextItems };
    }));
  }

  // ── Reordenar o ranking unificado (drag-and-drop) — persiste no backend ──
  function handleUnifiedReorder(nextOrder) {
    setUnifiedOrder(nextOrder);
    if (!unifiedGroupId) return;
    updateGroupOrder(unifiedGroupId, nextOrder).catch(err => {
      console.error('Não foi possível salvar a ordem do ranking unificado', err);
    });
  }

  // ── Criar tabela (categoria) ──
  async function handleCreateTable(table) {
    const { customFields, subcategories, ...category } = table;
    let cat = await createCategory(category);
    if (customFields?.length && category.templates.includes('custom')) {
      cat = await updateCustomFields(cat.id, customFields);
    }
    // subcategorias da criação entram logo depois da tabela, no mesmo "Criar"
    const createdSubs = [];
    for (const name of subcategories ?? []) createdSubs.push(await createSubcategory(cat.id, name));
    if (createdSubs.length) cat = { ...cat, subcategories: [...(cat.subcategories ?? []), ...createdSubs] };
    bumpWorks();
    const newTable = mapCategoryToTable(cat);
    setTables(prev => {
      const nextTables = [...prev, newTable];
      saveTableOrder(nextTables);
      return nextTables;
    });

    const newSelectedIds = [...selectedTableIds, newTable.id];
    setSelectedTableIds(newSelectedIds);
    setActiveTab(newTable.id);

    try {
      if (unifiedGroupId) {
        await updateGroup(unifiedGroupId, 'Unificado', newSelectedIds);
      } else {
        // primeira tabela da conta: o grupo ainda não existia (a carga só cria se já há
        // tabela). Sem ele, a ordem do Unificado não era salva até recarregar a página.
        const group = await createGroup('Unificado', newSelectedIds);
        setUnifiedGroupId(group.id);
      }
    } catch (err) {
      console.error('Erro ao atualizar grupo unificado:', err);
    }
  }

  function moveTable(draggedId, targetId) {
    if (!draggedId || !targetId || draggedId === targetId) return;

    setTables(prev => {
      const draggedIndex = prev.findIndex(table => table.id === draggedId);
      const targetIndex = prev.findIndex(table => table.id === targetId);
      if (draggedIndex < 0 || targetIndex < 0) return prev;

      const nextTables = [...prev];
      const [draggedTable] = nextTables.splice(draggedIndex, 1);
      nextTables.splice(targetIndex, 0, draggedTable);
      saveTableOrder(nextTables);
      return nextTables;
    });
  }

  // ── Excluir tabela (categoria) ──
  async function handleDeleteTable(id) {
    await deleteCategory(id);
    setTables(prev => prev.filter(t => t.id !== id));
    setSelectedTableIds(prev => prev.filter(x => x !== id));
    setActiveTab('unified');
    bumpWorks();
  }

  async function handleRenameTable(id, changes) {
    const { customFields, ...category } = changes;
    let updatedCategory = await updateCategory(id, category);
    // Sem o Personalizado, o próprio backend já apaga os campos.
    if (customFields && category.templates?.includes('custom')) {
      updatedCategory = await updateCustomFields(id, customFields);
    }
    setTables(prev => prev.map(table => table.id === id
      ? { ...table, ...mapCategoryToTable(updatedCategory, table.items) } : table));
    bumpWorks();
  }

  // ── Subcategorias (o modal de editar tabela aplica tudo no Salvar) ──
  async function handleAddSubcategory(tableId, name) {
    const created = await createSubcategory(tableId, name);
    setTables(prev => prev.map(table => table.id === tableId
      ? { ...table, subcategories: [...table.subcategories, created] }
      : table));
  }

  async function handleRenameSubcategory(tableId, subcategoryId, name) {
    const renamed = await renameSubcategory(tableId, subcategoryId, name);
    setTables(prev => prev.map(table => table.id !== tableId ? table : {
      ...table,
      subcategories: table.subcategories.map(sub => sub.id === subcategoryId ? renamed : sub),
      items: table.items.map(item => item.subcategoryId === subcategoryId
        ? { ...item, subcategoryName: renamed.name }
        : item),
    }));
  }

  /** As obras ficam na tabela, só perdem a subcategoria (igual ao ON DELETE SET NULL do banco). */
  async function handleDeleteSubcategory(tableId, subcategoryId) {
    await deleteSubcategory(tableId, subcategoryId);
    setFilters(current => (current.subcategory === subcategoryId ? { ...current, subcategory: null } : current));
    setTables(prev => prev.map(table => table.id !== tableId ? table : {
      ...table,
      subcategories: table.subcategories.filter(sub => sub.id !== subcategoryId),
      items: table.items.map(item => item.subcategoryId === subcategoryId
        ? { ...item, subcategoryId: null, subcategoryName: null }
        : item),
    }));
  }

  // ── Mudar seleção do Unificado (persiste no master_table_group) ──
  async function handleChangeSelectedTables(newIds) {
    setSelectedTableIds(newIds); // atualiza a UI na hora
    if (!unifiedGroupId) return;
    try {
      await updateGroup(unifiedGroupId, 'Unificado', newIds);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || tr.saveSelectionError);
    }
  }

  const retryLoad = () => setReloadKey(key => key + 1);
  const retryButton = (
    <button type="button" className="mr-btn mr-btn-outline mr-btn-sm" onClick={retryLoad}>
      {t.insights.result.retry}
    </button>
  );

  if (loadError) {
    return (
      <div className="rk-empty rk-error" role="alert">
        <p>{loadError}</p>
        {retryButton}
      </div>
    );
  }

  // aviso da(s) tabela(s) que não carregou(aram), no lugar de mostrar "tabela vazia"
  const failedNotice = (
    <div className="rk-empty rk-error" role="alert">
      <p>{tr.loadError}</p>
      {retryButton}
    </div>
  );

  const filterCount = activeFilterCount(filters);
  const mode = getMode(sortBy, useTimeWeight);

  // setinhas só fazem sentido na lista ordenada por nota (trocam obras empatadas)
  const canReorder = viewMode === 'list' && sortBy !== 'time';
  const isReordering = reordering && canReorder;

  function openTab(id) {
    setActiveTab(id);
    setReordering(false);
    // subcategoria é de uma tabela só: não vale na próxima
    setFilters(current => ({ ...current, subcategory: null }));
  }

  const controls = (
    <>
      {/* ponderação só vale ordenando por nota, então é uma das três ordens */}
      <div className="rk-seg" role="group" aria-label={tr.sortLabel}>
        {ORDERS.map(order => (
          <button key={order.mode} type="button" className={mode === order.mode ? 'is-active' : ''} aria-pressed={mode === order.mode}
            onClick={() => { setSortBy(order.sortBy); setUseTimeWeight(order.weight); }}>
            {tr[order.label]}
          </button>
        ))}
      </div>
      <div className="rk-seg" role="group" aria-label={tr.viewLabel}>
        <button type="button" className={viewMode === 'list' ? 'is-active' : ''} aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')} title={tr.viewList} aria-label={tr.viewList}>
          <List size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <button type="button" className={viewMode === 'grid' ? 'is-active' : ''} aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')} title={tr.viewGrid} aria-label={tr.viewGrid}>
          <LayoutGrid size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
      <button type="button" className={`mr-btn mr-btn-sm ${showFilters ? 'mr-btn-gold' : 'mr-btn-outline'}`} aria-expanded={showFilters} onClick={() => setShowFilters(v => !v)}>
        <SlidersHorizontal size={14} strokeWidth={1.8} aria-hidden="true" />
        {tr.filters}{filterCount > 0 && ` · ${filterCount}`}
      </button>
      {canReorder && (
        <button type="button" className={`mr-btn mr-btn-sm rk-only-mobile ${isReordering ? 'mr-btn-gold' : 'mr-btn-outline'}`} aria-pressed={isReordering} onClick={() => setReordering(v => !v)}>
          <ArrowUpDown size={14} strokeWidth={1.8} aria-hidden="true" />
          {isReordering ? tr.reorderDone : tr.reorder}
        </button>
      )}
    </>
  );

  // opções do painel saem das obras da aba (no Unificado, de todas as tabelas)
  const isUnified = activeTab === 'unified';
  const filterItems = isUnified ? tables.flatMap(table => table.items)
    : tables.find(table => table.id === activeTab)?.items ?? [];

  const filterPanel = showFilters && (
    <FilterPanel
      filters={filters}
      onChange={setFilters}
      onClear={() => setFilters({})}
      items={filterItems}
      tables={isUnified ? tables : undefined}
      selectedTableIds={selectedTableIds}
      onChangeTables={isUnified ? handleChangeSelectedTables : undefined}
      subcategories={isUnified ? [] : tables.find(table => table.id === activeTab)?.subcategories ?? []}
    />
  );

  return (
    <div className="rk-page">
      <div className="rk-head">
        <h1 className="rk-page-title">{tr.title}</h1>
      </div>

      <div className="rk-tabs">
        <div className="rk-tabs-scroll" role="tablist">
          <button type="button" role="tab" aria-selected={activeTab === 'unified'} className={`rk-tab${activeTab === 'unified' ? ' is-active' : ''}`} onClick={() => openTab('unified')}>
            {tr.unifiedTab}
          </button>
          {tables.map((t, index) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={`rk-tab${activeTab === t.id ? ' is-active' : ''}`}
              onClick={() => openTab(t.id)}
              draggable
              onDragStart={() => setDraggedTableId(t.id)}
              onDragEnd={() => setDraggedTableId(null)}
              onDragOver={event => event.preventDefault()}
              onDrop={() => {
                moveTable(draggedTableId, t.id);
                setDraggedTableId(null);
              }}
              onKeyDown={event => {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                event.preventDefault();
                const targetIndex = event.key === 'ArrowLeft' ? index - 1 : index + 1;
                if (targetIndex >= 0 && targetIndex < tables.length) {
                  moveTable(t.id, tables[targetIndex].id);
                }
              }}
              title={tr.reorderHint}
              style={{ opacity: draggedTableId === t.id ? 0.45 : 1 }}
            >
              {tableName(t.label)}
            </button>
          ))}
          {/* nova tabela = "aba nova", logo depois da última: sempre no mesmo lugar */}
          <button type="button" className="rk-tab-add" onClick={() => setShowNewTable(true)} aria-label={tr.newTable} title={tr.newTable}>
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        {/* outra tela (a seta diz que leva pra fora daqui); olha todas as obras, então só no Unificado */}
        {onNavigateToCreators && activeTab === 'unified' && (
          <button type="button" className="mr-btn mr-btn-outline mr-btn-sm" onClick={onNavigateToCreators} title={tr.seeCreatorsTitle} aria-label={tr.seeCreators}>
            <Users size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="rk-hide-mobile">{tr.seeCreators}</span>
            <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
          </button>
        )}
      </div>

      {showNewTable && (
        <NewTableModal onSave={handleCreateTable} onClose={() => setShowNewTable(false)} />
      )}

      {activeTab === 'unified' && failedTableIds.length > 0 && failedNotice}

      {activeTab === 'unified' ? (
        <UnifiedTable
          tables={tables}
          selectedTableIds={selectedTableIds}
          loading={loadingTableIds.length > 0}
          sortBy={sortBy}
          useTimeWeight={useTimeWeight}
          viewMode={viewMode}
          filters={filters}
          manualOrder={unifiedOrder}
          onReorder={handleUnifiedReorder}
          controls={controls}
          panel={filterPanel}
          reordering={isReordering}
          onOpenTable={openTab}
        />
      ) : (
        (() => {
          const table = tables.find(t => t.id === activeTab);
          if (!table) return null;
          if (failedTableIds.includes(table.id)) return failedNotice;
          return (
            <IndividualTable
              key={table.id} // zera o filtro de subcategoria ao trocar de tabela
              table={table}
              loading={loadingTableIds.includes(table.id)}
              sortBy={sortBy}
              useTimeWeight={useTimeWeight}
              viewMode={viewMode}
              filters={filters}
              controls={controls}
              panel={filterPanel}
              reordering={isReordering}
              onSaveWork={handleSaveWork}
              onDeleteWork={handleDeleteWork}
              onDeleteTable={handleDeleteTable}
              onMoveItem={handleMoveItem}
              onRenameTable={handleRenameTable}
              onAddSubcategory={handleAddSubcategory}
              onRenameSubcategory={handleRenameSubcategory}
              onDeleteSubcategory={handleDeleteSubcategory}
            />
          );
        })()
      )}
    </div>
  );
}
