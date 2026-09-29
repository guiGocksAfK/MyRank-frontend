import { useEffect, useState } from "react";
import useRevealOnce, { prefersReducedMotion } from "./useRevealOnce";
import "./howItWorks.css";

/*
 * Sequência de entrada (ms depois que a seção aparece na tela). Conta uma
 * história da esquerda pra direita: tabela → avaliação → a obra avaliada
 * entra no ranking geral e a lista se reordena.
 */
const STAGE = { IDLE: 0, RATING: 1, NEW_ITEM: 2, OTHERS: 3, SORTED: 4 };
const TIMELINE = [
  [STAGE.RATING, 900],
  [STAGE.NEW_ITEM, 2250],
  [STAGE.OTHERS, 2800],
  [STAGE.SORTED, 3400],
];
const COUNT_UP_MS = 1200;

/** Passo 1: abas de tabelas + top 3 da tabela ativa (linhas entram uma a uma). */
const DemoTable = ({ demo }) => (
  <div className="mr-panel demo-panel how-demo home-reveal" aria-hidden="true">
    <div className="demo-head how-demo-tabs">
      {demo.tabs.map((tab, i) => (
        <span key={tab} className={i === 0 ? "is-active" : ""}>{tab}</span>
      ))}
    </div>
    <ul className="demo-list how-demo-list-enter">
      {demo.table.map(([name, score], i) => (
        <li key={name} style={{ "--i": i }}>
          <span className="demo-pos">{i + 1}</span>
          <span className="demo-name">{name}</span>
          <span className="demo-score">{score.toFixed(1)}</span>
        </li>
      ))}
    </ul>
  </div>
);

/** Passo 2: o número conta até a nota e cada segmento acende quando o número passa por ele. */
const DemoRate = ({ demo, active }) => {
  const { name, score, timeLabel, time } = demo.rated;
  const [value, setValue] = useState(() => (prefersReducedMotion() ? score : 0));
  const done = value >= score;

  useEffect(() => {
    if (!active || prefersReducedMotion()) return undefined;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / COUNT_UP_MS, 1);
      setValue(p === 1 ? score : score * (1 - Math.pow(1 - p, 3))); // ease-out
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, score]);

  return (
    <div className="mr-panel demo-panel how-demo home-reveal" aria-hidden="true">
      <div className="demo-head">
        <span>{demo.ratedHead}</span>
        <span>{demo.ratedCategory}</span>
      </div>
      <div className="how-demo-body">
        <div className="how-demo-rated">
          <span className="demo-name">{name}</span>
          <span className={`how-demo-big${done && active ? " is-done" : ""}`}>
            {value.toFixed(1)}
          </span>
        </div>
        <div className="how-demo-scale">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={i < Math.round(score) && value >= i + 1 ? "is-on" : ""} />
          ))}
        </div>
        <div className="how-demo-meta">
          <span>{timeLabel}</span>
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Passo 3: a obra recém-avaliada entra sozinha no topo, as outras chegam
 * e a lista se reordena pela nota (quem se move são as linhas; os números ficam).
 */
const DemoUnified = ({ demo, stage }) => {
  const items = demo.unified.map(([name, type, score]) => ({ name, type, score }));
  const sorted = [...items].sort((a, b) => b.score - a.score);
  const newItem = items.find((item) => item.name === demo.rated.name);
  const order = stage >= STAGE.SORTED
    ? sorted
    : [newItem, ...items.filter((item) => item !== newItem)];

  return (
    <div className="mr-panel demo-panel how-demo home-reveal" aria-hidden="true">
      <div className="demo-head">
        <span>{demo.unifiedHead}</span>
        <span>{demo.unifiedMeta}</span>
      </div>
      <div className="how-demo-ranked">
        <ol className="how-demo-slots">
          {items.map((_, i) => (
            <li key={i}>{i + 1}</li>
          ))}
        </ol>
        {items.map((item) => {
          const shown = stage >= (item === newItem ? STAGE.NEW_ITEM : STAGE.OTHERS);
          return (
            <div
              key={item.name}
              className={`how-demo-ranked-row${shown ? " is-shown" : ""}`}
              style={{ "--rank": order.indexOf(item) }}
            >
              <span className="demo-name">
                {item.name}
                <small>{item.type}</small>
              </span>
              <span className="demo-score">{item.score.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** "Como funciona": 3 passos, cada um com uma miniatura do produto que se anima uma vez. */
const HowItWorks = ({ how }) => {
  const [sectionRef, visible] = useRevealOnce(0.45);
  const [stage, setStage] = useState(() => (prefersReducedMotion() ? STAGE.SORTED : STAGE.IDLE));

  useEffect(() => {
    if (!visible || prefersReducedMotion()) return undefined;
    const timers = TIMELINE.map(([next, at]) => setTimeout(() => setStage(next), at));
    return () => timers.forEach(clearTimeout);
  }, [visible]);

  const demos = [
    <DemoTable key="table" demo={how.demo} />,
    <DemoRate key="rate" demo={how.demo} active={stage >= STAGE.RATING} />,
    <DemoUnified key="unified" demo={how.demo} stage={stage} />,
  ];

  return (
    <section ref={sectionRef} className={`home-block${visible ? " is-visible" : ""}`}>
      <div className="home-block-head">
        <h2 className="home-block-title">{how.title}</h2>
        <p className="home-block-lede">{how.lede}</p>
      </div>

      <ol className="home-how-steps">
        {how.steps.map((step, i) => (
          <li key={step.title} className="home-feature" style={{ "--i": i }}>
            {demos[i]}
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default HowItWorks;
