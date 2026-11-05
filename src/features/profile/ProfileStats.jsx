import { useLanguage } from '../../shared/i18n';
import { computeBreakdown, computeHighlights, relativeTime } from '../../shared/useUnifiedItems';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

/** Aba Estatísticas: destaques à esquerda, obras por tipo (barras douradas) à direita. */
export default function ProfileStats({ works, loading }) {
  const { t, lang } = useLanguage();
  const tp = t.profile;

  if (loading) return <p className="pf-muted">{tp.loading}</p>;
  if (works.length === 0) return <p className="pf-empty">{tp.noWorks}</p>;

  const highlights = computeHighlights(works);
  const breakdown = computeBreakdown(works);
  const typeName = (type, fallback) => t.common.mediaTypes[type] || fallback;
  const max = Math.max(...breakdown.map((b) => b.count), 1);
  // horas por tipo (a Dashboard só mostra o total)
  const minutesByType = works.reduce((acc, w) => {
    const type = breakdown.some((b) => b.type === w.type) ? w.type : 'outro';
    acc[type] = (acc[type] || 0) + (Number(w.timeMinutes) || 0);
    return acc;
  }, {});

  const rows = highlights ? [
    { label: tp.bestRated, value: highlights.byNote?.title, meta: highlights.byNote ? Number(highlights.byNote.note).toFixed(1) : null },
    { label: tp.mostHours, value: highlights.byTime?.title, meta: highlights.byTime ? `${Math.round((highlights.byTime.timeMinutes || 0) / 60)}h` : null },
    { label: tp.lastAdded, value: highlights.byRecent?.title, meta: highlights.byRecent ? relativeTime(highlights.byRecent.addedDate, lang) : null },
    {
      label: tp.favCategory,
      value: highlights.favCategory ? typeName(highlights.favCategory.type, highlights.favCategory.label) : null,
      meta: highlights.favCategory ? fmt(tp.favCategoryMeta, { n: highlights.favCategory.count }) : null,
    },
  ] : [];

  return (
    <div className="pf-stats-grid">
      <section className="mr-panel pf-card">
        <h3 className="pf-group-title">{tp.highlights}</h3>
        <dl className="pf-kv">
          {rows.map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd>
                <span className="pf-kv-value">{r.value ?? '—'}</span>
                {r.meta && <span className="pf-kv-meta">{r.meta}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mr-panel pf-card">
        <h3 className="pf-group-title">{tp.distribution}</h3>
        <ul className="pf-bars">
          {breakdown.map((b) => (
            <li key={b.type}>
              <div className="pf-bar-head">
                <span>{typeName(b.type, b.label)}</span>
                <span className="pf-bar-meta">
                  {fmt(b.count === 1 ? tp.distLineOne : tp.distLineMany, { count: b.count, hours: `${Math.round((minutesByType[b.type] || 0) / 60)}h`, avg: b.avgLabel })}
                </span>
              </div>
              <div className="pf-bar" aria-hidden="true"><span style={{ width: `${(b.count / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
