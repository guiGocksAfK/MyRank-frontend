// Cores das barras do "perfil de gosto" na página de resultados.
// O prompt em si mora no backend (InsightPromptBuilder) — o front só renderiza.
export const BAR_COLORS = [
  'var(--mr-gold)',
  'var(--mr-blue-light)',
  'var(--mr-green)',
  'var(--mr-purple)',
  '#e24b4a',
];

// "há X" curto a partir de um ISO — usado no rótulo "gerado há…".
export function relativeFromNow(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const min = Math.round((Date.now() - then) / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `${min} min atrás`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.round(h / 24);
  return `${d} ${d === 1 ? 'dia' : 'dias'} atrás`;
}
