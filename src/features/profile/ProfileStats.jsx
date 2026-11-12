import { useState } from 'react';
import { useLanguage } from '../../shared/i18n';
import { TYPE_META } from '../../shared/useUnifiedItems';
import { genreKeys, genreLabel } from '../../shared/genres';
import { formatTime } from '../../utils/formatters';
import { TEMPLATE_ICONS, hasSquareCover } from '../../shared/tableTemplates';
import { ScoreStrip, EraTimeline } from './ProfileCharts';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const yearOf = (d) => {
  const y = d ? new Date(d).getFullYear() : NaN;
  return Number.isFinite(y) ? y : null;
};

// tons de dourado pros pedaços da barra de tipos (do maior pro menor)
const SHADES = [100, 72, 52, 38, 28, 20, 14, 10, 7];
const shade = (i) => `color-mix(in srgb, var(--mr-gold) ${SHADES[Math.min(i, SHADES.length - 1)]}%, transparent)`;

/** Capa no desenho do grid dos Rankings, com o rótulo do destaque embaixo. */
function HighlightCard({ label, item, meta }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const Icon = TEMPLATE_ICONS[item.template] ?? TEMPLATE_ICONS.custom;
  const square = hasSquareCover(item.template);
  const src = item.image;
  return (
    <div className="pf-hl">
      <span className="pf-hl-label">{label}</span>
      <div className={`rk-gcard-cover${square ? ' is-square' : ''}`}>
        {src && failedSrc !== src ? (
          <img className={`rk-gcard-img${square ? ' is-contain' : ''}`} src={src} alt={item.title} loading="lazy"
            onError={() => setFailedSrc(src)} />
        ) : (
          <span className="rk-gcard-empty"><Icon size={28} strokeWidth={1.4} aria-hidden="true" /></span>
        )}
      </div>
      <span className="pf-hl-title" title={item.title}>{item.title}</span>
      <span className="pf-hl-meta">{meta}</span>
    </div>
  );
}

/**
 * Aba Estatísticas: o que a Dashboard não mostra. Destaques com capa (sem
 * repetir obra), a régua das notas, a divisão por tipo e a linha do tempo.
 */
export default function ProfileStats({ works, loading }) {
  const { t, locale } = useLanguage();
  const tp = t.profile;
  const [measure, setMeasure] = useState('works'); // 'works' | 'hours'
  const [lit, setLit] = useState(null); // tipo aceso (mouse na barra ou na linha da tabela)

  if (loading) return <p className="pf-muted">{tp.loading}</p>;
  if (works.length === 0) return <p className="pf-empty">{tp.noWorks}</p>;

  const fmtNote = (n) => num(n).toLocaleString(locale || 'pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const hours = (min) => `${Math.round(num(min) / 60)}h`;

  // ── destaques: coisas que não aparecem no ranking nem na Dashboard. Cada um
  //    pega a primeira obra da sua lista que ainda não apareceu ──
  const used = new Set();
  const pick = (list) => {
    const found = list.find((w) => !used.has(w));
    if (found) used.add(found);
    return found;
  };
  const rated = works.filter((w) => num(w.note) > 0);
  const mean = rated.length ? rated.reduce((s, w) => s + num(w.note), 0) / rated.length : 0;
  const dated = works.filter((w) => yearOf(w.releaseDate));

  // gênero mais raro de cada obra, contando quantas obras suas têm cada gênero
  const genreCount = new Map();
  const keysOf = new Map(works.map((w) => [w, genreKeys(w.details?.genres)]));
  keysOf.forEach((keys) => keys.forEach((k) => genreCount.set(k, (genreCount.get(k) || 0) + 1)));
  const rarest = (w) => keysOf.get(w).reduce((best, k) => (!best || genreCount.get(k) < genreCount.get(best) ? k : best), null);

  const highlights = [
    {
      label: tp.hlOldest,
      item: pick([...dated].sort((a, b) => yearOf(a.releaseDate) - yearOf(b.releaseDate))),
      meta: (w) => yearOf(w.releaseDate),
    },
    {
      label: tp.hlNewest,
      item: pick([...dated].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))),
      meta: (w) => yearOf(w.releaseDate),
    },
    {
      // nota acima da média (ou igual, se tudo for a mesma nota) com o menor tempo
      label: tp.hlWorth,
      item: pick(rated.filter((w) => num(w.timeMinutes) > 0 && num(w.note) >= mean)
        .sort((a, b) => num(a.timeMinutes) - num(b.timeMinutes) || num(b.note) - num(a.note))),
      meta: (w) => `${formatTime(num(w.timeMinutes))} · ${fmtNote(w.note)}`,
    },
    {
      // gênero que você quase nunca vê e que mesmo assim ganhou nota alta
      label: tp.hlOutlier,
      item: pick(rated.filter((w) => keysOf.get(w).length > 0 && num(w.note) >= mean)
        .sort((a, b) => genreCount.get(rarest(a)) - genreCount.get(rarest(b)) || num(b.note) - num(a.note))),
      meta: (w) => `${genreLabel(rarest(w), t.rankings.genreNames)} · ${fmtNote(w.note)}`,
    },
  ].filter((h) => h.item);

  // ── por tipo ──
  const groups = new Map();
  for (const w of works) {
    const type = TYPE_META[w.type] ? w.type : 'outro';
    const g = groups.get(type) || { type, count: 0, minutes: 0, notes: [] };
    g.count += 1;
    g.minutes += num(w.timeMinutes);
    if (num(w.note) > 0) g.notes.push(num(w.note));
    groups.set(type, g);
  }
  const types = [...groups.values()].sort((a, b) => b.count - a.count || b.minutes - a.minutes);
  const valueOf = (g) => (measure === 'hours' ? g.minutes : g.count);
  const total = types.reduce((s, g) => s + valueOf(g), 0);
  const ordered = [...types].sort((a, b) => valueOf(b) - valueOf(a));
  const shadeOf = new Map(ordered.map((g, i) => [g.type, shade(i)]));
  const visible = total > 0 ? ordered.filter((g) => valueOf(g) > 0) : [];
  // centro de cada pedaço da barra, em %, pro balãozinho ficar em cima dele
  const centerOf = new Map();
  visible.reduce((acc, g) => {
    const share = valueOf(g) / total;
    centerOf.set(g.type, (acc + share / 2) * 100);
    return acc + share;
  }, 0);
  const litGroup = visible.find((g) => g.type === lit);
  const tipValue = (g) => (measure === 'hours'
    ? hours(g.minutes)
    : fmt(g.count === 1 ? tp.eraWorksOne : tp.eraWorks, { n: g.count }));
  const typeName = (type) => t.common.mediaTypes[type] || TYPE_META[type]?.label || type;

  return (
    <div className="pf-stats">
      <div className="pf-stats-grid is-top">
        <section className="mr-panel pf-card pf-hl-section">
          <div className="pf-hl-row">
            {highlights.map((h) => (
              <HighlightCard key={h.label} label={h.label} item={h.item} meta={h.meta(h.item)} />
            ))}
          </div>
        </section>

        <section className="mr-panel pf-card">
          <h3 className="pf-group-title">{tp.scoresTitle}</h3>
          <ScoreStrip works={works} />
        </section>
      </div>

      <div className="pf-stats-grid">
        <section className="mr-panel pf-card">
          <div className="pf-card-head">
            <h3 className="pf-group-title">{tp.distribution}</h3>
            <div className="rk-seg" role="group" aria-label={tp.distribution}>
              {[{ id: 'works', label: tp.colWorks }, { id: 'hours', label: tp.colHours }].map((m) => (
                <button key={m.id} type="button" className={measure === m.id ? 'is-active' : ''}
                  aria-pressed={measure === m.id} onClick={() => setMeasure(m.id)}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* passar o mouse num pedaço (ou na linha da tabela) acende o tipo e mostra o nome */}
          <div className="pf-split-wrap" onMouseLeave={() => setLit(null)}>
            <div className={`pf-split${lit ? ' has-lit' : ''}`} aria-hidden="true">
              {visible.map((g) => (
                <span key={g.type} className={g.type === lit ? 'is-lit' : ''}
                  style={{ flexGrow: valueOf(g), background: shadeOf.get(g.type) }}
                  onMouseEnter={() => setLit(g.type)} onClick={() => setLit(g.type)} />
              ))}
            </div>
            {litGroup && (
              <span className="pf-split-tip" style={{ left: `${centerOf.get(litGroup.type)}%` }}>
                {typeName(litGroup.type)} · {tipValue(litGroup)} · {Math.round((valueOf(litGroup) / total) * 100)}%
              </span>
            )}
          </div>

          <table className="pf-types">
            <thead>
              <tr>
                <th scope="col" aria-label={tp.distribution} />
                <th scope="col">{tp.colWorks}</th>
                <th scope="col">{tp.colHours}</th>
                <th scope="col">{tp.colAvg}</th>
              </tr>
            </thead>
            <tbody onMouseLeave={() => setLit(null)}>
              {types.map((g) => (
                <tr key={g.type} className={lit ? (g.type === lit ? 'is-lit' : 'is-dim') : ''}
                  onMouseEnter={() => setLit(g.type)}>
                  <th scope="row">
                    <span className="pf-swatch" style={{ background: shadeOf.get(g.type) }} aria-hidden="true" />
                    {typeName(g.type)}
                  </th>
                  <td>{g.count}</td>
                  <td>{g.minutes > 0 ? hours(g.minutes) : '—'}</td>
                  <td>{g.notes.length ? fmtNote(g.notes.reduce((s, n) => s + n, 0) / g.notes.length) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mr-panel pf-card">
          <h3 className="pf-group-title">{tp.eraTitle}</h3>
          <EraTimeline works={works} />
        </section>
      </div>
    </div>
  );
}
