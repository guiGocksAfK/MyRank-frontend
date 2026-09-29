import { useEffect, useMemo, useState } from "react";
import { prefersReducedMotion } from "./useRevealOnce";
import { computeTasteMatch } from "../social/socialData";
import "./homeCompare.css";

// Escala vertical do gráfico: a altura de cada ponta do fio é a nota (não a posição).
const SCALE_TOP = 10;
const SCALE_BOTTOM = 6;
const GRID = [10, 9, 8, 7, 6];
const AGREE_MAX_DIFF = 0.5; // até meio ponto de diferença conta como "concordam"
const COUNT_UP_MS = 1400;
const COUNT_UP_DELAY_MS = 1600;

const yOf = (score) => ((SCALE_TOP - score) / (SCALE_TOP - SCALE_BOTTOM)) * 100;

/** Conta de 0 até `target` depois que `active` liga (uma vez). */
const useCountUp = (target, active) => {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  useEffect(() => {
    if (!active || prefersReducedMotion() || target == null) return undefined;
    let frame;
    let start;
    const delay = setTimeout(() => {
      const tick = (now) => {
        start ??= now;
        const p = Math.min((now - start) / COUNT_UP_MS, 1);
        setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, COUNT_UP_DELAY_MS);
    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(frame);
    };
  }, [active, target]);
  return value;
};

/**
 * Afinidade entre duas pessoas: os dois rankings lado a lado, cada obra ligada à
 * mesma obra do outro lado por um fio. A altura de cada ponta é a nota que a
 * pessoa deu, então fio reto = notas parecidas e inclinado = divergência.
 * A % usa a mesma conta do produto (computeTasteMatch). Anima quando um
 * ancestral ganha .is-visible.
 */
const CompareBoard = ({ compare, active }) => {
  const works = useMemo(
    () => compare.works.map(([name, mine, theirs]) => ({
      name,
      mine,
      theirs,
      agree: Math.abs(mine - theirs) <= AGREE_MAX_DIFF,
    })),
    [compare.works]
  );

  const match = useMemo(
    () => computeTasteMatch(
      works.map((w) => ({ title: w.name, note: w.mine })),
      works.map((w) => ({ title: w.name, score: w.theirs }))
    ),
    [works]
  );
  const fight = match.disagreements[0];
  const pct = useCountUp(match.matchPct, active);

  return (
    <div className="cmp-board">
      <div className="cmp-top">
        <span className="cmp-person">
          <span className="home-avatar">{compare.you[0]}</span>
          {compare.you}
        </span>
        <span className="cmp-affinity">
          <b>{pct}%</b>
          <small>{compare.affinityLabel}</small>
        </span>
        <span className="cmp-person cmp-person-right">
          {compare.friend}
          <span className="home-avatar">{compare.friend[0]}</span>
        </span>
      </div>

      <div className="cmp-chart" aria-hidden="true">
        <div className="cmp-col cmp-col-left">
          {works.map((w, i) => (
            <span key={w.name} className="cmp-label" style={{ top: `${yOf(w.mine)}%`, "--i": i }}>
              <span className="cmp-name">{w.name}</span>
              <span className="cmp-score">{w.mine.toFixed(1)}</span>
              <span className="cmp-dot" />
            </span>
          ))}
        </div>

        <svg className="cmp-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          {GRID.map((g) => (
            <line key={g} className="cmp-grid" x1="0" x2="100" y1={yOf(g)} y2={yOf(g)} />
          ))}
          {works.map((w) => (
            <path
              key={w.name}
              className={`cmp-wire${w.agree ? " is-agree" : ""}${fight && w.name === fight.title ? " is-fight" : ""}`}
              d={`M0 ${yOf(w.mine)} L100 ${yOf(w.theirs)}`}
            />
          ))}
        </svg>

        <div className="cmp-col cmp-col-right">
          {works.map((w, i) => (
            <span key={w.name} className="cmp-label" style={{ top: `${yOf(w.theirs)}%`, "--i": i }}>
              <span className="cmp-dot" />
              <span className="cmp-score">{w.theirs.toFixed(1)}</span>
              <span className="cmp-name">{w.name}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="cmp-foot">
        <p className="cmp-legend">{compare.legend}</p>
        {fight && (
          <p className="cmp-fight">
            <small>{compare.fightLabel}</small>
            <span>
              {fight.title} · {fight.mine.toFixed(1)} vs {fight.theirs.toFixed(1)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default CompareBoard;
