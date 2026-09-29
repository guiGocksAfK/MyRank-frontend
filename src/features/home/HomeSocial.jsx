import { useState } from "react";
import useRevealOnce from "./useRevealOnce";
import CompareBoard from "./HomeCompare";
import TakeThread from "./HomeTakes";
import "./homeSocial.css";

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

/**
 * "Com amigos, se quiser": o lado social é opcional. O gráfico de afinidade
 * e a conversa nos takes acontecem quando a seção aparece; o interruptor
 * "Perfil privado" começa desligado e, se a pessoa ligar, tudo apaga com o
 * cadeado ("só você vê suas tabelas").
 */
const HomeSocial = ({ social, compare, takes }) => {
  const [sectionRef, visible] = useRevealOnce(0.35);
  const [isPrivate, setIsPrivate] = useState(false);

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
            onClick={() => setIsPrivate(!isPrivate)}
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
          visible ? "is-visible" : "",
          isPrivate ? "is-private" : "",
        ].join(" ")}
      >
        <div className="social-col">
          <CompareBoard compare={compare} active={visible} />
        </div>
        <div className="social-col">
          <TakeThread takes={takes} active={visible} />
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
