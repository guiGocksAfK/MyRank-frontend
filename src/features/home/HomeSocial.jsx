import { useEffect, useRef, useState } from "react";
import useRevealOnce, { prefersReducedMotion } from "./useRevealOnce";
import CompareBoard from "./HomeCompare";
import TakeThread from "./HomeTakes";
import "./homeSocial.css";

const AUTO_UNLOCK_MS = 1200; // o interruptor "Perfil privado" desliga sozinho e a história começa

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

/**
 * "Com amigos, se quiser": o lado social é opcional. Começa com o perfil
 * privado (tudo apagado com cadeado); o interruptor desliga sozinho e aí o
 * gráfico de afinidade e a conversa nos takes acontecem. A pessoa pode ligar
 * e desligar o interruptor pra ver os dois estados.
 */
const HomeSocial = ({ social, compare, takes }) => {
  const reduced = prefersReducedMotion();
  const [sectionRef, visible] = useRevealOnce(0.35);
  const [isPrivate, setIsPrivate] = useState(!reduced);
  const [started, setStarted] = useState(reduced);
  const touched = useRef(false);

  useEffect(() => {
    if (!visible || reduced) return undefined;
    const timer = setTimeout(() => {
      if (touched.current) return;
      setIsPrivate(false);
      setStarted(true);
    }, AUTO_UNLOCK_MS);
    return () => clearTimeout(timer);
  }, [visible, reduced]);

  const toggle = () => {
    touched.current = true;
    if (isPrivate) setStarted(true); // abrir o perfil pela primeira vez também dá a partida
    setIsPrivate(!isPrivate);
  };

  return (
    <section ref={sectionRef} className="home-block">
      <div className="home-block-head">
        <h2 className="home-block-title">{social.title}</h2>
        <div className="social-lede">
          <p className="home-block-lede">{social.lede}</p>
          <button
            type="button"
            role="switch"
            aria-checked={isPrivate}
            className="social-switch"
            onClick={toggle}
          >
            <span className="social-switch-track">
              <span className="social-switch-knob" />
            </span>
            {social.privateLabel}
          </button>
        </div>
      </div>

      <div
        className={[
          "social-grid",
          started ? "is-visible" : "",
          isPrivate ? "is-private" : "",
        ].join(" ")}
      >
        <div className="social-col">
          <CompareBoard compare={compare} active={started} />
        </div>
        <div className="social-col">
          <TakeThread takes={takes} active={started} />
        </div>

        <p className="social-lock" aria-hidden={!isPrivate}>
          <LockIcon />
          {social.lockedText}
        </p>
      </div>
    </section>
  );
};

export default HomeSocial;
