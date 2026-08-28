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

/** "há X" curto em pt-BR, a partir de um ISO. */
export function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const min = Math.round((Date.now() - then) / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `${min} min atrás`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} ${d === 1 ? 'dia' : 'dias'} atrás`;
  const months = Math.round(d / 30);
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'} atrás`;
  const years = Math.round(months / 12);
  return `${years} ${years === 1 ? 'ano' : 'anos'} atrás`;
}
