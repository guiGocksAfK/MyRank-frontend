import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useRevealOnce, { prefersReducedMotion } from "./useRevealOnce";
import "./homeCredits.css";

const START_MS = 300; // respiro antes do 1º cartão
const CARD_MS = 800;  // cada crédito: entra, fica e sai (o próximo entra enquanto ele sai)

/**
 * Chamada final como fim de filme: os créditos aparecem e somem no mesmo
 * lugar, um de cada vez, e depois entra a "cena pós-créditos" com o botão.
 * Toca sozinho, uma vez, quando a seção aparece na tela.
 */
const HomeCredits = ({ credits }) => {
  const [sectionRef, visible] = useRevealOnce(0.5);

  const cards = [
    ...credits.roles.map(([role, name]) => ({ key: role, role, name })),
    { key: "disclaimer", text: credits.disclaimer },
    { key: "brand", brand: true },
  ];

  // step = cartão na tela; cards.length = cena pós-créditos
  const [step, setStep] = useState(() => (prefersReducedMotion() ? Infinity : -1));

  useEffect(() => {
    if (!visible || prefersReducedMotion()) return undefined;
    const timers = Array.from({ length: cards.length + 1 }, (_, i) =>
      setTimeout(() => setStep(i), START_MS + i * CARD_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [visible, cards.length]);

  const isPost = step >= cards.length;

  return (
    <section ref={sectionRef} className="credits">
      <div className="credits-stage">
        {cards.map((card, i) => (
          <div
            key={card.key}
            className={`credits-card${step === i ? " is-active" : ""}`}
            aria-hidden="true"
          >
            {card.role && (
              <>
                <small>{card.role}</small>
                <span>{card.name}</span>
              </>
            )}
            {card.text && <p className="credits-disclaimer">{card.text}</p>}
            {card.brand && (
              <p className="credits-brand">
                My<span>Rank</span>
              </p>
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
