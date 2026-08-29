import { useEffect, useState } from 'react';
import { getUnifiedWorks } from '../services/WorkService';
import { mapWorkToItem } from '../utils/mapWork';

/**
 * Fonte única das obras do usuário (GET /works/unified), já mapeadas pro shape
 * dos componentes visuais. Usado pelo rodapé e pelo perfil — nada de mockData.
 */

const ACCENTS = /[̀-ͯ]/g;

const TYPE_BY_KEYWORD = [
  [/livro|book/, 'livro'],
  [/jogo|game/, 'jogo'],
  [/anime/, 'anime'],
  [/serie|series|show|\btv\b/, 'serie'],
  [/filme|movie/, 'filme'],
];

function inferType(categoryName) {
  const s = (categoryName || '').normalize('NFD').replace(ACCENTS, '').toLowerCase();
  for (const [re, type] of TYPE_BY_KEYWORD) if (re.test(s)) return type;
  return 'outro';
}

export function useUnifiedItems() {
  const [items, setItems] = useState(null); // null = carregando
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    getUnifiedWorks()
      .then((data) => {
        if (!active) return;
        const list = (Array.isArray(data) ? data : []).map((w) => ({
          ...mapWorkToItem(w),
          type: inferType(w.categoryName),
          categoryName: w.categoryName,
          creator: (w.creator || '').trim(),
        }));
        setItems(list);
      })
      .catch((err) => {
        if (active) {
          setError(err);
          setItems([]);
        }
      });
    return () => { active = false; };
  }, []);

  return { items, loading: items === null, error };
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Estatísticas agregadas a partir das obras. */
export function computeStats(items = []) {
  const obras = items.length;
  const totalMinutes = items.reduce((s, i) => s + num(i.timeMinutes), 0);
  // Média simples das notas (NÃO a ponderada por tempo / finalNote).
  const notes = items.map((i) => num(i.note)).filter((n) => n > 0);
  const avgNote = notes.length ? notes.reduce((s, n) => s + n, 0) / notes.length : 0;

  return {
    obras,
    totalMinutes,
    totalHours: Math.round(totalMinutes / 60),
    avgNote,
    avgNoteLabel: notes.length ? avgNote.toFixed(1) : '—',
  };
}

export const TYPE_META = {
  filme: { icon: '🎬', label: 'Filmes' },
  serie: { icon: '📺', label: 'Séries' },
  jogo:  { icon: '🎮', label: 'Jogos' },
  livro: { icon: '📚', label: 'Livros' },
  anime: { icon: '🌸', label: 'Animes' },
  outro: { icon: '📦', label: 'Outros' },
};

const avgOf = (list) => {
  const notes = list.map((i) => num(i.note)).filter((n) => n > 0);
  return notes.length ? notes.reduce((s, n) => s + n, 0) / notes.length : 0;
};

/** Contagem + média simples por tipo de obra, ordenado por quantidade. */
export function computeBreakdown(items = []) {
  const groups = new Map();
  for (const it of items) {
    const t = TYPE_META[it.type] ? it.type : 'outro';
    if (!groups.has(t)) groups.set(t, []);
    groups.get(t).push(it);
  }
  const total = items.length || 1;
  return [...groups.entries()]
    .map(([type, list]) => {
      const avg = avgOf(list);
      return {
        type,
        ...TYPE_META[type],
        count: list.length,
        share: list.length / total,
        avgLabel: avg ? avg.toFixed(1) : '—',
      };
    })
    .sort((a, b) => b.count - a.count);
}

/** Melhor nota, mais horas, adição mais recente e categoria favorita. */
export function computeHighlights(items = []) {
  if (!items.length) return null;
  const rated = items.filter((i) => num(i.note) > 0);
  const byNote = rated.length
    ? rated.reduce((best, i) => (num(i.note) > num(best.note) ? i : best))
    : null;
  const byTime = items.reduce((top, i) => (num(i.timeMinutes) > num(top.timeMinutes) ? i : top));
  const dated = items.filter((i) => i.addedDate);
  const byRecent = dated.length
    ? dated.reduce((r, i) => (new Date(i.addedDate) > new Date(r.addedDate) ? i : r))
    : null;
  const favCategory = computeBreakdown(items)[0] || null;
  return { byNote, byTime, byRecent, favCategory };
}

// Frases de tempo relativo por idioma. n = valor; um = singular, mu = plural.
const REL_PHRASES = {
  PT: {
    now: 'agora mesmo',
    min: (n) => `${n} min atrás`,
    h: (n) => `${n}h atrás`,
    day: (n) => `${n} ${n === 1 ? 'dia' : 'dias'} atrás`,
    month: (n) => `${n} ${n === 1 ? 'mês' : 'meses'} atrás`,
    year: (n) => `${n} ${n === 1 ? 'ano' : 'anos'} atrás`,
  },
  EN: {
    now: 'just now',
    min: (n) => `${n} min ago`,
    h: (n) => `${n}h ago`,
    day: (n) => `${n} ${n === 1 ? 'day' : 'days'} ago`,
    month: (n) => `${n} ${n === 1 ? 'month' : 'months'} ago`,
    year: (n) => `${n} ${n === 1 ? 'year' : 'years'} ago`,
  },
  ES: {
    now: 'justo ahora',
    min: (n) => `hace ${n} min`,
    h: (n) => `hace ${n}h`,
    day: (n) => `hace ${n} ${n === 1 ? 'día' : 'días'}`,
    month: (n) => `hace ${n} ${n === 1 ? 'mes' : 'meses'}`,
    year: (n) => `hace ${n} ${n === 1 ? 'año' : 'años'}`,
  },
};

/** "há X" curto, a partir de um ISO. `lang` = 'PT' | 'EN' | 'ES' (default PT). */
export function relativeTime(iso, lang = 'PT') {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const p = REL_PHRASES[lang] || REL_PHRASES.PT;
  const min = Math.round((Date.now() - then) / 60000);
  if (min < 1) return p.now;
  if (min < 60) return p.min(min);
  const h = Math.round(min / 60);
  if (h < 24) return p.h(h);
  const d = Math.round(h / 24);
  if (d < 30) return p.day(d);
  const months = Math.round(d / 30);
  if (months < 12) return p.month(months);
  const years = Math.round(months / 12);
  return p.year(years);
}
