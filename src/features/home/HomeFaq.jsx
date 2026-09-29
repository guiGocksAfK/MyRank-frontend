import { useId, useState } from "react";
import "./homeFaq.css";

/** Miniatura que "responde" a pergunta aberta, no espaço embaixo do título. */
const FaqVisual = ({ v }) => {
  switch (v.kind) {
    case "free":
      return (
        <div className="faqv faqv-free">
          <b>{v.big}</b>
          <small>{v.label}</small>
        </div>
      );
    case "switch":
      return (
        <div className="faqv faqv-switch">
          <span className="faqv-switch-row">
            <span className="faqv-track">
              <span className="faqv-knob" />
            </span>
            {v.label}
          </span>
          <span className="faqv-captions">
            <span>{v.on}</span>
            <span>{v.off}</span>
          </span>
        </div>
      );
    case "list":
      return (
        <div className="faqv mr-panel demo-panel">
          <ol className="demo-list">
            {v.rows.map(([name, type, score], i) => (
              <li key={name}>
                <span className="demo-pos">{i + 1}</span>
                <span className="demo-name">
                  {name}
                  <small>{type}</small>
                </span>
                <span className="demo-score">{score.toFixed(1)}</span>
              </li>
            ))}
          </ol>
        </div>
      );
    case "weighted":
      return (
        <div className="faqv faqv-weighted">
          <span className="faqv-chip">{v.chip}</span>
          <span className="faqv-scores">
            {v.from} <span aria-hidden="true">→</span> <b>{v.to}</b>
          </span>
          <small>{v.sub}</small>
        </div>
      );
    case "auto":
      return (
        <div className="faqv mr-panel demo-panel faqv-auto">
          <div className="demo-head">
            <span>{v.title}</span>
            <span className="faqv-tag">{v.tag}</span>
          </div>
          <dl>
            {v.fields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case "badge":
      return (
        <div className="faqv faqv-badge">
          <span className="faqv-medal" aria-hidden="true">★</span>
          <b>{v.name}</b>
          <span className="faqv-bar">
            <span />
          </span>
          <small>{v.meta}</small>
        </div>
      );
    default:
      return null;
  }
};

/**
 * FAQ editorial: título parado à esquerda (sticky) com uma miniatura que
 * responde a pergunta aberta; perguntas à direita separadas por linhas finas,
 * sem caixas. A primeira já vem aberta; se a pessoa fechar tudo, a miniatura some.
 */
const HomeFaq = ({ faq }) => {
  const [open, setOpen] = useState(0);
  const baseId = useId();

  return (
    <section id="faq" className="faq">
      <div className="faq-side">
        <h2 className="home-block-title">{faq.title}</h2>
        <p className="home-block-lede">{faq.lede}</p>
        <div className="faq-visual" aria-hidden="true">
          {open >= 0 && <FaqVisual key={open} v={faq.items[open].v} />}
        </div>
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
