import { useEffect, useMemo, useState } from 'react';
import Modal from '../../shared/components/Modal';
import { getUnifiedWorks } from '../../services/WorkService';
import { useLanguage } from '../../shared/i18n';
import { groupByTable, toText, toSheet, toJson, download } from './exportWorks';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
const FORMATS = ['copy', 'sheet', 'json'];

/**
 * Exportar obras: escolhe as tabelas (todas ou algumas) e o formato. "Copiar
 * texto" manda a lista formatada pra área de transferência; planilha e backup
 * baixam um arquivo. Tudo montado no navegador, a partir do /works/unified.
 */
export default function ExportWorksModal({ onClose }) {
  const { t, locale } = useLanguage();
  const tp = t.profile;
  const tx = tp.export;
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
  const count = chosen.reduce((s, g) => s + g.works.length, 0);

  const toggle = (id) => {
    setCopied(false);
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      // marcar todas é o mesmo que "Todas"
      return next.size === tables.length ? new Set() : next;
    });
  };

  const run = async () => {
    setError('');
    const day = new Date().toISOString().slice(0, 10);
    try {
      if (format === 'copy') {
        await navigator.clipboard.writeText(toText(chosen, { locale, footer: tx.footer }));
        setCopied(true);
      } else if (format === 'sheet') {
        download(`myrank-obras-${day}.csv`, toSheet(chosen, {
          locale,
          columns: tx.columns,
          typeName: (type) => t.common.mediaTypes[type] || type,
        }), 'text/csv;charset=utf-8');
        onClose();
      } else {
        download(`myrank-obras-${day}.json`, toJson(chosen), 'application/json');
        onClose();
      }
    } catch {
      setError(tx.error);
    }
  };

  return (
    <Modal
      title={tx.title}
      onClose={onClose}
      width={520}
      footer={(
        <>
          {error && <p className="pf-form-error" role="alert">{error}</p>}
          {copied && !error && <p className="pf-form-ok" role="status">{tx.copied}</p>}
          <button type="button" className="mr-btn mr-btn-ghost" onClick={onClose}>{tp.cancel}</button>
          <button type="button" className="mr-btn mr-btn-gold" onClick={run} disabled={!works || count === 0}>
            {format === 'copy' ? tx.copy : tx.download}
          </button>
        </>
      )}
    >
      {failed ? (
        <p className="pf-modal-copy">{tx.error}</p>
      ) : !works ? (
        <p className="pf-modal-copy">{tp.loading}</p>
      ) : (
        <>
          <div className="pf-field">
            <span className="mr-field-label">{tx.tables}</span>
            <div className="pf-chips" role="group" aria-label={tx.tables}>
              <button type="button" className={`pf-chip${picked.size === 0 ? ' is-on' : ''}`}
                aria-pressed={picked.size === 0} onClick={() => { setPicked(new Set()); setCopied(false); }}>
                {tx.all}
              </button>
              {tables.map((g) => (
                <button key={g.id} type="button" className={`pf-chip${picked.has(g.id) ? ' is-on' : ''}`}
                  aria-pressed={picked.has(g.id)} onClick={() => toggle(g.id)}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pf-field">
            <span className="mr-field-label">{tx.format}</span>
            <div className="rk-seg" role="group" aria-label={tx.format}>
              {FORMATS.map((f) => (
                <button key={f} type="button" className={format === f ? 'is-active' : ''} aria-pressed={format === f}
                  onClick={() => { setFormat(f); setCopied(false); }}>
                  {tx.formats[f].label}
                </button>
              ))}
            </div>
            <p className="mr-field-hint">{tx.formats[format].desc}</p>
          </div>

          <p className="pf-export-count">
            {count === 0 ? tx.empty : fmt(count === 1 ? tx.countOne : tx.count, { n: count })}
          </p>
        </>
      )}
    </Modal>
  );
}
