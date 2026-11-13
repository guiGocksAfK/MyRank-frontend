// Backend (WorkResponseDTO) → shape usado pelos componentes visuais
import { templateType } from '../shared/tableTemplates';

function safeImageUrl(url) {
  const s = (url || '').trim();
  return /^https?:\/\//i.test(s) ? s : '';
}

export function mapWorkToItem(work) {
  return {
    id: work.id,
    categoryId: work.categoryId ?? null,
    categoryName: work.categoryName ?? null,
    title: work.title,
    template: work.template ?? 'custom',
    type: templateType(work.template),
    details: work.details ?? {},
    sub: work.creator ?? '',
    note: work.score,
    score: work.score,
    timeMinutes: work.timeMinutes,
    bonusTime: work.timeBonusScore,
    finalNote: work.finalScore,
    addedDate: work.createdAt ?? null,
    createdAt: work.createdAt ?? null,
    releaseDate: work.releaseDate,
    image: safeImageUrl(work.imageUrl),
    subcategoryId: work.subcategoryId ?? null,
    subcategoryName: work.subcategoryName ?? null,
  };
}

// Payload do ItemModal → DTO esperado pelo backend (createWork/updateWork)
export function mapItemToWorkDTO(item, categoryId) {
  return {
    categoryId,
    template: item.template ?? 'custom',
    details: item.details ?? {},
    title: item.title,
    imageUrl: item.image || null,
    creator: item.sub || null,
    releaseDate: item.releaseDate || null,
    timeMinutes: item.timeMinutes,
    score: item.note,
    // 0 = sem subcategoria (no update, null significaria "não mexe")
    subcategoryId: item.subcategoryId ?? 0,
  };
}

// Category (backend) → tabela usada pelo RankingsTab
export function mapCategoryToTable(category, items = []) {
  return {
    id: category.id,
    label: category.name,
    templates: category.templates?.length ? category.templates : ['custom'],
    subcategories: category.subcategories ?? [],
    customFields: category.customFields ?? [],
    items,
  };
}
