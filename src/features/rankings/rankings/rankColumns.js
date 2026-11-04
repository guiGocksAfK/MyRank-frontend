/** Colunas da linha do ranking (fora do rankRow.jsx: arquivo de componente só exporta componente). */
export function rowColumns(mode, { unified = false, actions = false, reordering = false } = {}) {
  const cols = ['2.25rem', '40px', 'minmax(0, 1fr)'];
  if (unified) cols.push('minmax(0, 160px)');
  if (mode === 'weight') cols.push('64px', '64px', '96px');
  else if (mode === 'time') cols.push('64px', '96px');
  else cols.push('72px');
  if (reordering) cols.push('auto');
  if (actions) cols.push('72px');
  return cols.join(' ');
}
