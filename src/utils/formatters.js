import { genreKeys } from '../shared/genres';
import { creatorKey, splitCreators } from '../shared/creatorNames';
export function formatScore(value, locale, prefix = '') {
  const num = Number(value) || 0;
  const text = locale
    ? num.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : num.toFixed(1);
  return `${prefix}${text}`;
}

// Formata minutos → "2h 30min" / "45min" / "50h"
export function formatTime(minutes) {
  if (!minutes || minutes <= 0) return '—';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

// Converte minutos → { hours, mins } para o input HH:mm
export function minutesToHHMM(minutes) {
  if (!minutes || minutes <= 0) return { hours: '', mins: '' };
  return {
    hours: Math.floor(minutes / 60),
    mins: minutes % 60,
  };
}

export function getYear(isoDate) {
  if (!isoDate) return null;
  return parseInt(isoDate.split('-')[0], 10);
}

export function sortItems(items, sortBy, useTimeWeight) {
  return [...items].sort((a, b) => {
    if (sortBy === 'time') return b.timeMinutes - a.timeMinutes;
    const noteDifference = useTimeWeight ? b.finalNote - a.finalNote : b.note - a.note;
    return noteDifference;
  });
}

export function getDisplayedNote(item, useTimeWeight) {
  return useTimeWeight ? item.finalNote : item.note;
}

export function getMode(sortBy, useTimeWeight) {
  if (sortBy === 'time') return 'time';
  return useTimeWeight ? 'weight' : 'simple';
}

// Status da API (TMDB / MyAnimeList) agrupados nos dois botões do filtro
const STATUS_GROUPS = {
  ongoing: ['Returning Series', 'In Production', 'currently_airing', 'currently_publishing', 'on_hiatus'],
  finished: ['Ended', 'Canceled', 'finished_airing', 'finished', 'discontinued'],
};

export function statusGroup(status) {
  return Object.keys(STATUS_GROUPS).find(group => STATUS_GROUPS[group].includes(status)) ?? null;
}

const normalize = (text) => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Gêneros da obra já juntados numa chave só (ver shared/genres.js). */
export function itemGenres(item) {
  return genreKeys(item.details?.genres);
}

// filtros de faixa contam como um só (de + até)
const FILTER_GROUPS = [
  ['search'], ['types'], ['genres'], ['creators'], ['noteMin', 'noteMax'], ['yearMin', 'yearMax'],
  ['hoursMin', 'hoursMax'], ['addedFrom', 'addedTo'], ['status'], ['subcategory'],
];

const isSet = (v) => (Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== '');

/** Quantos filtros estão ligados (lista vazia e texto em branco não contam). */
export function activeFilterCount(filters) {
  return FILTER_GROUPS.filter(keys => keys.some(key => isSet(filters?.[key]))).length;
}

const outside = (value, min, max) => (min != null && value < min) || (max != null && value > max);

/**
 * Filtros da barra: busca (título ou criador), tipos, gêneros e criadores
 * (qualquer um dos marcados), faixas de nota, ano, horas e data em que foi
 * adicionada, status e subcategoria ('none' = sem subcategoria).
 */
export function applyFilters(items, filters) {
  if (!filters || activeFilterCount(filters) === 0) return items;
  const query = normalize(filters.search).trim();
  return items.filter(item => {
    if (query && !normalize(item.title).includes(query) && !normalize(item.sub).includes(query)) return false;
    if (filters.types?.length && !filters.types.includes(item.type)) return false;
    if (filters.genres?.length && !itemGenres(item).some(genre => filters.genres.includes(genre))) return false;
    if (filters.creators?.length) {
      const wanted = filters.creators.map(creatorKey);
      if (!splitCreators(item.sub).some(name => wanted.includes(creatorKey(name)))) return false;
    }
    if (outside(item.note ?? 0, filters.noteMin, filters.noteMax)) return false;
    if (filters.yearMin != null || filters.yearMax != null) {
      const year = getYear(item.releaseDate);
      if (year == null || outside(year, filters.yearMin, filters.yearMax)) return false;
    }
    if (outside((item.timeMinutes || 0) / 60, filters.hoursMin, filters.hoursMax)) return false;
    if (filters.addedFrom || filters.addedTo) {
      const day = item.addedDate?.slice(0, 10);
      if (!day || (filters.addedFrom && day < filters.addedFrom) || (filters.addedTo && day > filters.addedTo)) return false;
    }
    if (filters.status != null && statusGroup(item.details?.status) !== filters.status) return false;
    if (filters.subcategory === 'none' ? !!item.subcategoryId
      : filters.subcategory != null && item.subcategoryId !== filters.subcategory) return false;
    return true;
  });
}
