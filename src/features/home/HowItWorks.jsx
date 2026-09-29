import { useEffect, useRef, useState } from "react";
import "./howItWorks.css";

/*
 * Sequência de entrada (ms depois que a seção aparece na tela). Conta uma
 * história da esquerda pra direita: tabela → avaliação → a obra avaliada
 * entra no ranking geral e a lista se reordena.
 */
const STAGE = { IDLE: 0, IN: 1, RATING: 2, NEW_ITEM: 3, OTHERS: 4, SORTED: 5 };
const TIMELINE = [
  [STAGE.IN, 0],
  [STAGE.RATING, 1200],
  [STAGE.NEW_ITEM, 3000],
  [STAGE.OTHERS, 3700],
  [STAGE.SORTED, 4500],
];
const COUNT_UP_MS = 1600;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Passo 1: abas de tabelas + top 3 da tabela ativa (linhas entram uma a uma). */
const DemoTable = ({ demo }) => (
  <div className="how-demo" aria-hidden="true">
    <div className="how-demo-head how-demo-tabs">
      {demo.tabs.map((tab, i) => (
        <span key={tab} className={i === 0 ? "is-active" : ""}>{tab}</span>
      ))}
    </div>
    <ul className="how-demo-list how-demo-list-enter">
      {demo.table.map(([name, score], i) => (
        <li key={name} style={{ "--i": i }}>
          <span className="how-demo-pos">{i + 1}</span>
          <span className="how-demo-name">{name}</span>
          <span className="how-demo-score">{score.toFixed(1)}</span>
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
    <div className="how-demo" aria-hidden="true">
      <div className="how-demo-head">
        <span>{demo.ratedHead}</span>
        <span>{demo.ratedCategory}</span>
      </div>
      <div className="how-demo-body">
        <div className="how-demo-rated">
          <span className="how-demo-name">{name}</span>
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
  const newName = demo.rated.name;
  const items = demo.unified.map(([name, type, score]) => ({ name, type, score }));
  const sorted = [...items].sort((a, b) => b.score - a.score);
  const newItem = items.find((item) => item.name === newName);
  const order = stage >= STAGE.SORTED
    ? sorted
    : [newItem, ...items.filter((item) => item !== newItem)];

  return (
    <div className="how-demo" aria-hidden="true">
      <div className="how-demo-head">
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
          const isNew = item === newItem;
          const shown = stage >= (isNew ? STAGE.NEW_ITEM : STAGE.OTHERS);
          return (
            <div
              key={item.name}
              className={`how-demo-ranked-row${shown ? " is-shown" : ""}`}
              style={{ "--rank": order.indexOf(item) }}
            >
              <span className="how-demo-name">
                {item.name}
                <small>{item.type}</small>
              </span>
              <span className="how-demo-score">{item.score.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** "Como funciona": 3 passos, cada um com uma miniatura do produto que se anima uma vez. */
const HowItWorks = ({ how }) => {
  const sectionRef = useRef(null);
  const [stage, setStage] = useState(() => (prefersReducedMotion() ? STAGE.SORTED : STAGE.IDLE));

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || prefersReducedMotion()) return undefined;
    const timers = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        TIMELINE.forEach(([next, at]) => {
          timers.push(setTimeout(() => setStage(next), at));
        });
      },
      { threshold: 0.45 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  const demos = [
    <DemoTable key="table" demo={how.demo} />,
    <DemoRate key="rate" demo={how.demo} active={stage >= STAGE.RATING} />,
    <DemoUnified key="unified" demo={how.demo} stage={stage} />,
  ];

  return (
    <section ref={sectionRef} className={`home-how${stage >= STAGE.IN ? " is-visible" : ""}`}>
      <div className="home-how-head">
        <h2 className="home-how-title">{how.title}</h2>
        <p className="home-how-lede">{how.lede}</p>
      </div>

      <ol className="home-how-steps">
        {how.steps.map((step, i) => (
          <li key={step.title} className="home-how-step" style={{ "--i": i }}>
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
