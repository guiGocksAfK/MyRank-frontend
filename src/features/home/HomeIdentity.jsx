import useRevealOnce from "./useRevealOnce";
import "./homeIdentity.css";

// As 3 obras favoritas do perfil do cartaz ("O Fora da Lei").
// URLs verificadas: TMDB (Breaking Bad, O Poderoso Chefão), Steam (Red Dead Redemption 2).
// O do meio fica atrás do título, então vai o mais escuro.
const POSTERS = [
  "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
  "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
  "https://cdn.akamai.steamstatic.com/steam/apps/1174180/library_600x900.jpg",
];

/**
 * "Sua identidade" como cartaz de cinema: a pessoa é a protagonista, o perfil
 * da IA é o título, o resumo é a sinopse e os criadores favoritos viram o
 * bloco de créditos. Entra uma vez, como abertura de filme.
 */
const HomeIdentity = ({ identity }) => {
  const [sectionRef, visible] = useRevealOnce(0.3);

  return (
    <section
      ref={sectionRef}
      className={`idp${visible ? " is-visible" : ""}`}
      aria-label={identity.label}
    >
      <div className="idp-posters" aria-hidden="true">
        {POSTERS.map((url) => (
          <div key={url} className="idp-poster" style={{ backgroundImage: `url(${url})` }} />
        ))}
      </div>
      <div className="idp-veil" aria-hidden="true" />

      <div className="idp-content">
        <p className="idp-presents">{identity.presents}</p>
        <p className="idp-starring">{identity.starring}</p>

        <h2 className="idp-title">
          {identity.persona.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>

        <p className="idp-synopsis">{identity.synopsis}</p>

        <p className="idp-genres">
          {identity.taste.map(([label, pct]) => (
            <span key={label}>
              {label} <b>{pct}%</b>
            </span>
          ))}
        </p>

        <div className="idp-credits">
          {identity.credits.map(([role, names]) => (
            <span key={role} className="idp-credit">
              <small>{role}</small>
              {names}
            </span>
          ))}
          <span className="idp-credit">
            <small>{identity.recoLabel}</small>
            {identity.reco}
          </span>
        </div>

        <p className="idp-note">{identity.note}</p>
      </div>
    </section>
  );
};

export default HomeIdentity;
