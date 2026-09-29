import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { prefersReducedMotion } from "./useRevealOnce";
import "./homeCredits.css";

/**
 * Chamada final como fim de filme: os créditos sobem conforme a pessoa rola
 * (a rolagem controla o ritmo) e, quando parece que acabou, entra a
 * "cena pós-créditos" com o botão de criar conta.
 *
 * A seção é alta e o conteúdo fica "grudado" na tela (sticky); o progresso
 * da rolagem dentro dela vira a variável CSS --p (0 → 1), que o CSS usa pra
 * mover os créditos e revelar a cena pós-créditos.
 */
const HomeCredits = ({ credits }) => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || prefersReducedMotion()) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      const p = range > 0 ? Math.min(Math.max(-rect.top / range, 0), 1) : 1;
      el.style.setProperty("--p", p.toFixed(4));
      el.classList.toggle("is-post", p > 0.8); // botão só clicável depois que a cena aparece
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={sectionRef} className="credits">
      <div className="credits-stage">
        <div className="credits-roll" aria-hidden="true">
          {credits.roles.map(([role, name]) => (
            <div key={role} className="credits-entry">
              <small>{role}</small>
              <span>{name}</span>
            </div>
          ))}
          <p className="credits-disclaimer">{credits.disclaimer}</p>
          <p className="credits-brand">
            My<span>Rank</span>
          </p>
        </div>

        <div className="credits-post">
          <p className="credits-post-label">{credits.post}</p>
          <h2 className="credits-title">{credits.title}</h2>
          <Link to="/cadastrar" className="mr-btn mr-btn-gold mr-btn-lg">
            {credits.cta}
          </Link>
          <p className="credits-fine">{credits.fine}</p>
        </div>
      </div>
    </section>
  );
};

export default HomeCredits;
