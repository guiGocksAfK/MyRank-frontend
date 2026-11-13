import { useWorks } from './worksContext';

/**
 * Fonte única das obras do usuário (GET /works/unified), já mapeadas pro shape
 * dos componentes visuais. A busca mora no WorksProvider; aqui só se lê.
 */

export function useUnifiedItems() {
  const { items, error } = useWorks().unified;
  return { items, loading: items === null, error };
}

export const TYPE_META = {
  filme: { icon: '🎬', label: 'Filmes' },
  serie: { icon: '📺', label: 'Séries' },
  jogo:  { icon: '🎮', label: 'Jogos' },
  livro: { icon: '📚', label: 'Livros' },
  anime: { icon: '🌸', label: 'Animes' },
  manga: { icon: '📖', label: 'Mangás' },
  musica: { icon: '🎵', label: 'Músicas' },
  album: { icon: '💿', label: 'Álbuns' },
  outro: { icon: '📦', label: 'Outros' },
};

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
