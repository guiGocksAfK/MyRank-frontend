import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useRevealOnce, { prefersReducedMotion } from "./useRevealOnce";
import "./homeCredits.css";

const START_MS = 300; // respiro antes do 1º cartão

// Tempo de leitura de cada cartão, calculado pelas palavras dele: ~4 palavras
// por segundo (leitura silenciosa média, ~240/min) + 0,5s pra o olho achar o
// texto depois do fade. Assim cada idioma ganha o tempo que o próprio texto pede.
const REACTION_MS = 500;
const MS_PER_WORD = 250;
const countWords = (...texts) => texts.join(" ").split(/\s+/).filter(Boolean).length;
const readingMs = (...texts) => REACTION_MS + countWords(...texts) * MS_PER_WORD;

/**
 * Chamada final como fim de filme: os créditos aparecem e somem no mesmo
 * lugar, dois por cartão, e depois entra a "cena pós-créditos" com o botão.
 * Toca sozinho, uma vez, quando a seção aparece na tela; cada cartão fica o
 * tempo de leitura do próprio texto.
 */
const HomeCredits = ({ credits }) => {
  const [sectionRef, visible] = useRevealOnce(0.5);

  const pairs = [];
  for (let i = 0; i < credits.roles.length; i += 2) pairs.push(credits.roles.slice(i, i + 2));
  const cards = [
    ...pairs.map((pair) => ({ key: pair[0][0], pair, ms: readingMs(...pair.flat()) })),
    { key: "end", end: true, ms: readingMs("MyRank", credits.disclaimer) },
  ];
  const cardMs = cards.map((card) => card.ms);

  // step = cartão na tela; cards.length = cena pós-créditos
  const [step, setStep] = useState(() => (prefersReducedMotion() ? Infinity : -1));

  const timing = cardMs.join(",");
  useEffect(() => {
    if (!visible || prefersReducedMotion()) return undefined;
    // cada cartão entra quando o anterior termina; o último passo é a cena pós-créditos
    const durations = timing.split(",").map(Number);
    let at = START_MS;
    const timers = [...durations, 0].map((ms, i) => {
      const timer = setTimeout(() => setStep(i), at);
      at += ms;
      return timer;
    });
    return () => timers.forEach(clearTimeout);
  }, [visible, timing]);

  const isPost = step >= cards.length;

  return (
    <section ref={sectionRef} className="credits">
      <div className="credits-stage">
        {cards.map((card, i) => (
          <div
            key={card.key}
            className={`credits-card${card.end ? " credits-card-end" : ""}${step === i ? " is-active" : ""}`}
            aria-hidden="true"
          >
            {card.pair?.map(([role, name]) => (
              <div key={role} className="credits-entry">
                <small>{role}</small>
                <span>{name}</span>
              </div>
            ))}
            {card.end && (
              <>
                <p className="credits-brand">
                  My<span>Rank</span>
                </p>
                <p className="credits-disclaimer">{credits.disclaimer}</p>
              </>
            )}
          </div>
        ))}

        <div className={`credits-post${isPost ? " is-active" : ""}`}>
          <p className="credits-post-label">{credits.post}</p>
          <h2 className="credits-title">{credits.title}</h2>
          <Link to="/cadastrar" className="mr-btn mr-btn-gold mr-btn-lg" tabIndex={isPost ? 0 : -1}>
            {credits.cta}
          </Link>
          <p className="credits-fine">{credits.fine}</p>
        </div>
      </div>
    </section>
  );
};

export default HomeCredits;
