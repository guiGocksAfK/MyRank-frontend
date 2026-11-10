import { useCallback, useRef, useState } from 'react';
import { useLanguage } from '../../shared/i18n';
import { TEMPLATE_ICONS } from '../../shared/tableTemplates';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const yearOf = (d) => {
  const y = d ? new Date(d).getFullYear() : NaN;
  return Number.isFinite(y) ? y : null;
};

const MAX_ROWS = 14; // fileiras de pontos antes de virar "+N"
const BIG = 10;      // tamanho normal do ponto (px)
const SMALL = 7;     // quando aperta (muitas obras ou notas muito próximas)

/**
 * Enxame: cada ponto fica na nota exata e sobe uma fileira só quando encostaria
 * num ponto já colocado. Notas iguais viram pilha; notas próximas ficam lado a
 * lado. Devolve a fileira de cada obra e quantas não couberam em cada ponto.
 */
function swarm(items, xOf, size) {
  const rows = [];
  const placed = [];
  const hidden = new Map();
  items.forEach((w) => {
    const x = xOf(w);
    let row = 0;
    while (row < MAX_ROWS && (rows[row] || []).some((px) => Math.abs(px - x) < size + 2)) row += 1;
    if (row >= MAX_ROWS) {
      const key = Math.round(x / (size + 2));
      hidden.set(key, { x, n: (hidden.get(key)?.n || 0) + 1 });
      return;
    }
    (rows[row] = rows[row] || []).push(x);
    placed.push({ w, row });
  });
  return { placed, hidden: [...hidden.values()], height: rows.length };
}

/**
 * "Como você dá nota": cada obra é um ponto na nota exata (9,4 fica em 9,4).
 * A régua vai da menor nota da pessoa até 10, então ninguém fica com metade
 * vazia. Os pontos se ajeitam como enxame (e diminuem quando aperta); a média
 * aparece como uma marca embaixo. Passar o mouse (ou tocar) num ponto mostra
 * a obra num cartãozinho.
 */
export function ScoreStrip({ works }) {
  const { t, locale } = useLanguage();
  const tp = t.profile;
  const [hover, setHover] = useState(null); // { w, row }
  const [width, setWidth] = useState(0);
  const observer = useRef(null);
  // mede a largura da régua (e acompanha quando a tela muda) pra saber quem encosta em quem
  const plotRef = useCallback((node) => {
    observer.current?.disconnect();
    if (!node) return;
    setWidth(node.clientWidth);
    observer.current = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.current.observe(node);
  }, []);
  const fmtNote = (n) => num(n).toLocaleString(locale || 'pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const rated = works.filter((w) => num(w.note) > 0);
  if (rated.length === 0) return <p className="pf-muted">{tp.noWorks}</p>;

  const noteOf = (w) => Math.round(num(w.note) * 10) / 10;
  const notes = rated.map(noteOf);
  const low = Math.min(...notes);
  const high = Math.max(...notes);
  // começa no meio-ponto abaixo da menor nota; com tudo em 10, mostra de 9 a 10
  const min = Math.min(Math.floor(low * 2) / 2, 9);
  const span = 10 - min;
  // faixa curta (ex.: 9 a 10) ganha tracinho a cada 0,1, com número a cada 0,5
  const step = span <= 1 ? 0.1 : span <= 4 ? 0.5 : 1;
  const labelEvery = span <= 1 ? 0.5 : step;
  const ticks = [];
  for (let i = 0; min + i * step <= 10 + 1e-9; i += 1) {
    const v = Math.round((min + i * step) * 10) / 10;
    ticks.push({ v, label: Math.abs(v / labelEvery - Math.round(v / labelEvery)) < 1e-6 });
  }
  const pos = (v) => ((v - min) / span) * 100;

  // ordem estável: pela nota e depois pelo título
  const ordered = [...rated].sort((a, b) => noteOf(a) - noteOf(b) || String(a.title).localeCompare(String(b.title)));
  const xOf = (w) => (pos(noteOf(w)) / 100) * (width || 560);
  let size = BIG;
  let layout = swarm(ordered, xOf, size);
  if (layout.hidden.length || layout.height > 8) {
    size = SMALL;
    layout = swarm(ordered, xOf, size);
  }
  const rowStep = size + 2;

  const mean = notes.reduce((s, n) => s + n, 0) / notes.length;
  // mais comum: a nota exata que mais se repete (empate fica com a mais alta)
  const counts = new Map();
  notes.forEach((n) => counts.set(n, (counts.get(n) || 0) + 1));
  const [mode] = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];

  return (
    <div className="pf-strip">
      {/* os três números que resumem o jeito de dar nota, grandes, como na Dashboard */}
      <dl className="pf-strip-stats">
        <div><dt>{tp.scoresAvgLabel}</dt><dd>{fmtNote(mean)}</dd></div>
        <div><dt>{tp.scoresModeLabel}</dt><dd>{fmtNote(mode)}</dd></div>
        <div><dt>{tp.scoresRangeLabel}</dt><dd>{low === high ? fmtNote(low) : `${fmtNote(low)}–${fmtNote(high)}`}</dd></div>
      </dl>

      <div ref={plotRef} className="pf-strip-plot" style={{ minHeight: `${layout.height * rowStep + 28}px` }}
        onMouseLeave={() => setHover(null)}>
        {layout.placed.map(({ w, row }) => {
          const on = hover?.w === w;
          const show = () => setHover({ w, row });
          return (
            <button key={`${w._tableId ?? w.categoryName}:${w.id}`} type="button"
              className={`pf-strip-dot${size === SMALL ? ' is-small' : ''}${noteOf(w) >= 10 ? ' is-ten' : ''}${on ? ' is-on' : ''}`}
              style={{ left: `${pos(noteOf(w))}%`, bottom: `${row * rowStep}px` }}
              aria-label={`${w.title} · ${fmtNote(w.note)}`}
              onMouseEnter={show}
              onFocus={show}
              onBlur={() => setHover(null)}
              // no toque o celular simula o "mouse em cima" e o clique juntos: o clique só mostra
              onClick={show} />
          );
        })}
        {layout.hidden.map((h) => (
          <span key={h.x} className="pf-strip-more" style={{ left: `${(h.x / (width || 560)) * 100}%`, bottom: `${MAX_ROWS * rowStep}px` }}>
            +{h.n}
          </span>
        ))}

        {hover && (
          <DotCard work={hover.w} note={fmtNote(hover.w.note)} left={pos(noteOf(hover.w))} bottom={(hover.row + 1) * rowStep + 6} />
        )}
      </div>

      <div className="pf-strip-axis" aria-hidden="true">
        {ticks.map(({ v, label }) => (
          <span key={v} className={`pf-strip-tick${label ? ' is-major' : ''}`} style={{ left: `${pos(v)}%` }}>
            {label ? fmtNote(v) : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Cartãozinho em cima do ponto: capinha, nome e nota. Perto das pontas, encosta pro lado de dentro. */
function DotCard({ work, note, left, bottom }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const Icon = TEMPLATE_ICONS[work.template] ?? TEMPLATE_ICONS.custom;
  const align = left < 18 ? ' is-start' : left > 82 ? ' is-end' : '';
  const src = work.image;
  return (
    <div className={`pf-dotcard${align}`} style={{ left: `${left}%`, bottom: `${bottom}px` }} role="status">
      <span className="pf-dotcard-cover">
        {src && failedSrc !== src
          ? <img src={src} alt="" onError={() => setFailedSrc(src)} />
          : <Icon size={14} strokeWidth={1.6} aria-hidden="true" />}
      </span>
      <span className="pf-dotcard-text">
        <span className="pf-dotcard-title">{work.title}</span>
        <span className="pf-dotcard-note">{note}</span>
      </span>
    </div>
  );
}

/**
 * "De que época": uma coluna por década com uma capa só, a de maior nota
 * daquela época, e embaixo quantas obras e a média. Escala com qualquer
 * quantidade de obras; décadas vazias viram "· · ·" e, quando são muitas
 * décadas, as capas encolhem pra caber todas numa linha (até no celular).
 * "Seu forte" é a década com a maior média.
 */
export function EraTimeline({ works }) {
  const { t, locale } = useLanguage();
  const tp = t.profile;
  const [failedUrls, setFailedUrls] = useState(() => new Set());
  const markFailed = (url) => setFailedUrls((prev) => new Set(prev).add(url));
  const fmtNote = (n) => num(n).toLocaleString(locale || 'pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const byDecade = new Map();
  for (const w of works) {
    const y = yearOf(w.releaseDate);
    if (!y) continue;
    const d = Math.floor(y / 10) * 10;
    if (!byDecade.has(d)) byDecade.set(d, []);
    byDecade.get(d).push({ ...w, year: y });
  }
  if (byDecade.size === 0) return <p className="pf-muted">{tp.eraEmpty}</p>;

  // só as décadas com obra, mais a atual (mesmo vazia: "ainda nada daqui").
  // Entre duas que não são vizinhas entra uma marquinha "· · ·" no lugar das vazias.
  const now = Math.floor(new Date().getFullYear() / 10) * 10;
  const decades = [...new Set([...byDecade.keys(), now])].sort((a, b) => a - b);
  const columns = [];
  decades.forEach((d, i) => {
    if (i > 0 && d - decades[i - 1] > 10) columns.push('gap');
    columns.push(d);
  });

  // seu forte: a maior média; empate fica com a que tem mais obras, depois a mais recente
  const avgOf = (list) => {
    const rated = list.filter((w) => num(w.note) > 0);
    return rated.length ? rated.reduce((s, w) => s + num(w.note), 0) / rated.length : null;
  };
  const top = [...byDecade.entries()]
    .map(([d, list]) => ({ d, n: list.length, avg: avgOf(list) }))
    .filter((e) => e.avg !== null)
    .sort((a, b) => b.avg - a.avg || b.n - a.n || b.d - a.d)[0] || null;
  const decadeName = (y) => fmt(tp.decade, { y, d: y < 2000 ? String(y % 100).padStart(2, '0') : y });

  return (
    <div className="pf-era">
      {/* --n/--g: quantas décadas e quantos buracos, pro CSS saber a altura das capas */}
      {/* is-dense: muitas décadas; no celular fica só capa e ano pra caber */}
      <div className={`pf-era-row${columns.length >= 7 ? ' is-dense' : ''}`}
        style={{ '--n': decades.length, '--g': columns.length - decades.length }}>
        {columns.map((d, i) => {
          if (d === 'gap') return <span key={`gap-${i}`} className="pf-era-gap" aria-hidden="true">· · ·</span>;
          const list = byDecade.get(d) || [];
          const best = [...list].sort((a, b) => num(b.note) - num(a.note))[0];
          const avg = avgOf(list);
          const Icon = best ? (TEMPLATE_ICONS[best.template] ?? TEMPLATE_ICONS.custom) : null;
          return (
            <div key={d} className={`pf-era-col${d === top?.d ? ' is-top' : ''}${best ? '' : ' is-empty'}`}>
              <span className="pf-era-cover" title={best ? `${best.title} · ${best.year}` : undefined}>
                {best && (best.image && !failedUrls.has(best.image)
                  ? <img src={best.image} alt={best.title} loading="lazy" onError={() => markFailed(best.image)} />
                  : <Icon size={18} strokeWidth={1.4} aria-hidden="true" />)}
                {!best && <span aria-hidden="true">—</span>}
              </span>
              <span className="pf-era-year">{d}</span>
              <span className="pf-era-info">
                {list.length === 0 ? tp.eraNone : fmt(list.length === 1 ? tp.eraWorksOne : tp.eraWorks, { n: list.length })}
              </span>
              {avg !== null && <span className="pf-era-avg">{fmt(tp.eraAvg, { n: fmtNote(avg) })}</span>}
            </div>
          );
        })}
      </div>
      {top && <p className="pf-histo-foot">{fmt(tp.eraTop, { decade: decadeName(top.d).toLowerCase(), n: fmtNote(top.avg) })}</p>}
    </div>
  );
}
