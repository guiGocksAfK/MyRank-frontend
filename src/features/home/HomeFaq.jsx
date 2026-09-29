import { useId, useState } from "react";
import "./homeFaq.css";

/**
 * FAQ editorial: título parado à esquerda (sticky), perguntas à direita
 * separadas por linhas finas, sem caixas. Uma resposta aberta por vez; ela
 * desliza ao abrir e o "+" gira até virar "×".
 */
const HomeFaq = ({ faq }) => {
  const [open, setOpen] = useState(-1);
  const baseId = useId();

  return (
    <section id="faq" className="faq">
      <div className="faq-side">
        <h2 className="home-block-title">{faq.title}</h2>
        <p className="home-block-lede">{faq.lede}</p>
      </div>

      <ul className="faq-list">
        {faq.items.map((item, i) => {
          const isOpen = open === i;
          const panelId = `${baseId}-faq-${i}`;
          return (
            <li key={item.q} className={`faq-item${isOpen ? " is-open" : ""}`}>
              <button
                type="button"
                className="faq-question"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                {item.q}
                <span className="faq-icon" aria-hidden="true" />
              </button>
              <div id={panelId} className="faq-answer" role="region">
                <div>
                  <p>{item.a}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default HomeFaq;
