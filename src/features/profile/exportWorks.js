import { tableName, templateType } from '../../shared/tableTemplates';

const yearOf = (date) => {
  const y = date ? new Date(date).getFullYear() : NaN;
  return Number.isFinite(y) ? y : null;
};

const byScore = (a, b) => (Number(b.score) || 0) - (Number(a.score) || 0)
  || String(a.title).localeCompare(String(b.title));

/** Agrupa por tabela, na ordem em que as tabelas aparecem, cada uma em ordem de nota. */
export function groupByTable(works) {
  const groups = new Map();
  works.forEach((w) => {
    const key = w.categoryId ?? w.categoryName;
    // nome sem o emoji do começo, igual às abas dos Rankings
    if (!groups.has(key)) groups.set(key, { id: key, name: tableName(w.categoryName || '') || '—', works: [] });
    groups.get(key).works.push(w);
  });
  return [...groups.values()].map((g) => ({ ...g, works: [...g.works].sort(byScore) }));
}

/**
 * Texto pra colar no WhatsApp/Discord: um bloco por tabela, em ordem de nota.
 *   Filmes
 *   1. Interestelar (2014) · 9,3
 */
export function toText(groups, { locale, footer }) {
  const note = (n) => Number(n || 0).toLocaleString(locale || 'pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const blocks = groups.map((g) => [
    g.name,
    ...g.works.map((w, i) => {
      const year = yearOf(w.releaseDate);
      return `${i + 1}. ${w.title}${year ? ` (${year})` : ''} · ${note(w.score)}`;
    }),
  ].join('\n'));
  return `${blocks.join('\n\n')}\n\n${footer}`;
}

const cell = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * Planilha: ponto e vírgula e nota com vírgula, que é o que o Excel e o Google
 * Planilhas em português esperam. A marca BOM no começo garante os acentos.
 */
export function toSheet(groups, { locale, columns, typeName }) {
  const note = (n) => (n === null || n === undefined ? '' : Number(n).toLocaleString(locale || 'pt-BR'));
  const day = (d) => (d ? String(d).slice(0, 10) : '');
  const rows = groups.flatMap((g) => g.works.map((w) => [
    w.title, typeName(templateType(w.template)), g.name, note(w.score), w.timeMinutes ?? '',
    w.creator ?? '', day(w.releaseDate), day(w.createdAt),
  ]));
  const lines = [columns, ...rows].map((r) => r.map(cell).join(';'));
  return `\uFEFF${lines.join('\r\n')}`;
}

/** Backup: os campos crus, do jeito que a API manda. */
export function toJson(groups) {
  return JSON.stringify(groups.flatMap((g) => g.works.map((w) => ({
    title: w.title, template: w.template, table: g.name, score: w.score, timeMinutes: w.timeMinutes,
    creator: w.creator ?? null, releaseDate: w.releaseDate ?? null, addedAt: w.createdAt ?? null,
  }))), null, 2);
}

export function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
