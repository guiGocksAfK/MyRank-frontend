import { getUnifiedWorks } from '../../services/WorkService';

// Colunas do arquivo, na ordem. A chave é o campo que vem da API.
const COLUMNS = [
  ['title', 'titulo'],
  ['template', 'tipo'],
  ['categoryName', 'tabela'],
  ['score', 'nota'],
  ['timeMinutes', 'tempo_minutos'],
  ['creator', 'criador'],
  ['releaseDate', 'lancamento'],
  ['createdAt', 'adicionada_em'],
];

const csvCell = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Baixa todas as obras da pessoa (de todas as tabelas) num arquivo CSV ou JSON.
 * Monta no próprio navegador a partir do /works/unified, sem rota nova no back.
 */
export async function exportWorks(format) {
  const works = await getUnifiedWorks();
  const rows = (Array.isArray(works) ? works : []).map((w) =>
    Object.fromEntries(COLUMNS.map(([key, col]) => [col, w[key] ?? null])));
  const day = new Date().toISOString().slice(0, 10);

  if (format === 'json') {
    download(`myrank-obras-${day}.json`, JSON.stringify(rows, null, 2), 'application/json');
  } else {
    const lines = [COLUMNS.map(([, col]) => col).join(',')]
      .concat(rows.map((r) => COLUMNS.map(([, col]) => csvCell(r[col])).join(',')));
    // a marca BOM no começo faz o Excel abrir os acentos certinho
    download(`myrank-obras-${day}.csv`, `\uFEFF${lines.join('\n')}`, 'text/csv;charset=utf-8');
  }
  return rows.length;
}
