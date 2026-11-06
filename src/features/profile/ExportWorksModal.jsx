import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Copy, Download, FileJson, Sheet } from 'lucide-react';
import Modal from '../../shared/components/Modal';
import { getUnifiedWorks } from '../../services/WorkService';
import { useLanguage } from '../../shared/i18n';
import { groupByTable, toText, toSheet, toJson, download } from './exportWorks';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
const FORMATS = [
  { id: 'copy', icon: ClipboardList },
  { id: 'sheet', icon: Sheet },
  { id: 'json', icon: FileJson },
];
const PREVIEW_LINES = 7;

/** Corta o texto nas primeiras linhas, com "…" quando sobra. */
const head = (text, keepLast = false) => {
  const lines = text.split('\n');
  if (lines.length <= PREVIEW_LINES + 1) return lines;
  return [...lines.slice(0, PREVIEW_LINES), '…', ...(keepLast ? lines.slice(-1) : [])];
};

/**
 * Exportar obras: primeiro o formato (3 cartões), depois as tabelas (com
 * quantas obras cada uma tem) e uma prévia do que vai sair. "Copiar texto"
 * manda pra área de transferência; planilha e backup baixam um arquivo. Tudo
 * montado no navegador, a partir do /works/unified.
 */
export default function ExportWorksModal({ onClose }) {
  const { t, locale } = useLanguage();
  const tx = t.profile.export;
  const [works, setWorks] = useState(null);
  const [failed, setFailed] = useState(false);
  const [picked, setPicked] = useState(() => new Set()); // vazio = todas
  const [format, setFormat] = useState('copy');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getUnifiedWorks()
      .then((data) => setWorks(Array.isArray(data) ? data : []))
      .catch(() => setFailed(true));
  }, []);

  const tables = useMemo(() => groupByTable(works || []), [works]);
  const chosen = picked.size === 0 ? tables : tables.filter((g) => picked.has(g.id));
  const total = tables.reduce((s, g) => s + g.works.length, 0);
  const count = chosen.reduce((s, g) => s + g.works.length, 0);

  const sheetOptions = {
    locale,
    columns: tx.columns,
    typeName: (type) => t.common.mediaTypes[type] || type,
  };

  const choose = (next) => { setCopied(false); setError(''); next(); };

  const toggle = (id) => choose(() => setPicked((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    // marcar todas é o mesmo que "Todas"
    return next.size === tables.length ? new Set() : next;
  }));

  const run = async () => {
    setError('');
    const day = new Date().toISOString().slice(0, 10);
    try {
      if (format === 'copy') {
        await navigator.clipboard.writeText(toText(chosen, { locale, footer: tx.footer }));
        setCopied(true);
      } else if (format === 'sheet') {
        download(`myrank-obras-${day}.csv`, toSheet(chosen, sheetOptions), 'text/csv;charset=utf-8');
        onClose();
      } else {
        download(`myrank-obras-${day}.json`, toJson(chosen), 'application/json');
        onClose();
      }
    } catch {
      setError(tx.error);
    }
  };

  // prévia: o começo do que vai sair, do jeito que vai sair
  const preview = () => {
    if (count === 0) return <p className="pf-export-empty">{tx.empty}</p>;
    if (format === 'sheet') {
      const rows = chosen.flatMap((g) => g.works.map((w) => [
        w.title, g.name, Number(w.score || 0).toLocaleString(locale, { maximumFractionDigits: 2 }),
      ]));
      return (
        <table className="pf-export-sheet">
          <thead><tr>{[0, 2, 3].map((i) => <th key={i}>{tx.columns[i]}</th>)}</tr></thead>
          <tbody>
            {rows.slice(0, 4).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
            {rows.length > 4 && <tr><td colSpan={3}>…</td></tr>}
          </tbody>
        </table>
      );
    }
    const lines = format === 'copy'
      ? head(toText(chosen, { locale, footer: tx.footer }), true)
      : head(toJson(chosen));
    return <pre className="pf-export-pre">{lines.join('\n')}</pre>;
  };

  const action = format === 'copy'
    ? fmt(count === 1 ? tx.copyOne : tx.copyN, { n: count })
    : fmt(count === 1 ? tx.downloadOne : tx.downloadN, { n: count });

  return (
    <Modal
      title={tx.title}
      onClose={onClose}
      width={560}
      footer={(
        <>
          {error && <p className="pf-form-error" role="alert">{error}</p>}
          {copied && !error && <p className="pf-form-ok" role="status">{tx.copied}</p>}
          <button type="button" className="mr-btn mr-btn-gold" onClick={run} disabled={!works || count === 0}>
            {format === 'copy'
              ? <Copy size={16} strokeWidth={2} aria-hidden="true" />
              : <Download size={16} strokeWidth={2} aria-hidden="true" />}
            {action}
          </button>
        </>
      )}
    >
      {failed ? (
        <p className="pf-modal-copy">{tx.error}</p>
      ) : !works ? (
        <p className="pf-modal-copy">{t.profile.loading}</p>
      ) : (
        <div className="pf-export">
          <div className="pf-export-block">
            <span className="mr-field-label">{tx.format}</span>
            <div className="pf-opts" role="group" aria-label={tx.format}>
              {FORMATS.map(({ id, icon: Icon }) => (
                <button key={id} type="button" className={`pf-opt pf-export-format${format === id ? ' is-on' : ''}`}
                  aria-pressed={format === id} onClick={() => choose(() => setFormat(id))}>
                  <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
                  <span>{tx.formats[id].label}</span>
                  <small>{tx.formats[id].desc}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="pf-export-block">
            <span className="mr-field-label">{tx.tables}</span>
            <div className="pf-chips" role="group" aria-label={tx.tables}>
              <button type="button" className={`pf-chip${picked.size === 0 ? ' is-on' : ''}`}
                aria-pressed={picked.size === 0} onClick={() => choose(() => setPicked(new Set()))}>
                {tx.all}<span className="pf-chip-n">{total}</span>
              </button>
              {tables.map((g) => (
                <button key={g.id} type="button" className={`pf-chip${picked.has(g.id) ? ' is-on' : ''}`}
                  aria-pressed={picked.has(g.id)} onClick={() => toggle(g.id)}>
                  {g.name}<span className="pf-chip-n">{g.works.length}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pf-export-block">
            <span className="mr-field-label">{tx.preview}</span>
            <div className="pf-export-preview">{preview()}</div>
          </div>
        </div>
      )}
    </Modal>
  );
}
