import { Link } from "react-router-dom";
import "./proPage.css";

const CheckIcon = ({ size = 18, color = "#d4af37" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const DashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const TrendIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 17 9 11 13 15 21 6" />
    <polyline points="15 6 21 6 21 12" />
  </svg>
);

const CompassIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polygon points="14.5 9.5 12.8 12.8 9.5 14.5 11.2 11.2 14.5 9.5" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <polyline points="21 3 21 9 15 9" />
  </svg>
);

const beneficios = [
  {
    icon: <SparklesIcon />,
    title: "Perfil de consumidor sob medida",
    desc: "A IA lê suas notas, tabelas e o tempo dedicado a cada obra e resume tudo num perfil único — o tipo de consumidor que você é, com base no que você realmente avaliou.",
  },
  {
    icon: <TrendIcon />,
    title: "Padrões que você não percebe sozinho",
    desc: "Gêneros que você nota mais alto sem perceber, criadores que se repetem no seu topo, épocas em que seu gosto mudou de direção.",
  },
  {
    icon: <CompassIcon />,
    title: "Sugestões baseadas no seu ranking",
    desc: "Nada de recomendação genérica. As sugestões partem do que já está no topo do seu ranking — do jeito que só faz sentido pra quem você é como consumidor.",
  },
  {
    icon: <RefreshIcon />,
    title: "Atualiza conforme você avalia",
    desc: "Cada nova nota refina o perfil. Quanto mais você usa o MyRank, mais precisos ficam os insights — sem preencher formulário ou configurar nada.",
  },
];

const checklist = [
  "Perfil de consumidor gerado por IA",
  "Padrões e tendências do seu histórico",
  "Sugestões baseadas no seu ranking",
  "Atualização contínua, sem configurar nada",
];

const comparacao = [
  { feature: "Tabelas e avaliações ilimitadas", free: true, pro: true },
  { feature: "Ranking unificado", free: true, pro: true },
  { feature: "Comparar com amigos", free: true, pro: true },
  { feature: "Perfil de consumidor por IA", free: false, pro: true },
  { feature: "Padrões e tendências de consumo", free: false, pro: true },
  { feature: "Sugestões baseadas no seu ranking", free: false, pro: true },
];

const ProPage = () => {
  return (
    <main className="pro-page">
      <div className="pro-container">

        {/* Hero + card de preço */}
        <section className="pro-hero">
          <div className="pro-hero-copy">
            <Link to="/" className="pro-back pro-fade-1">← Voltar</Link>

            <span className="pro-eyebrow pro-fade-2">MyRank Pro</span>

            <h1 className="pro-title pro-fade-3">
              Seu ranking mostra<br />o que você consumiu.<br />
              <span className="pro-title-accent">A IA mostra quem você é.</span>
            </h1>

            <p className="pro-lead pro-fade-4">
              Uma IA analisa seu perfil completo e transforma isso em insights personalizados
              sobre o seu estilo, suas tendências e o que provavelmente vem a seguir.
            </p>

            <div className="pro-chips pro-fade-5">
              {["Perfil por IA", "Sugestões personalizadas", "Atualização automática"].map((chip) => (
                <span key={chip} className="pro-chip">{chip}</span>
              ))}
            </div>
          </div>

          <div className="pro-price-card pro-fade-6">
            <div className="pro-price-head">
              <div className="pro-price-row">
                <span className="pro-price-value">R$ 19,90</span>
                <span className="pro-price-period">/mês</span>
              </div>
              <span className="pro-price-sub">Cancele quando quiser</span>
            </div>

            <div className="pro-divider" />

            <ul className="pro-check-list">
              {checklist.map((item) => (
                <li key={item}><CheckIcon />{item}</li>
              ))}
            </ul>

            <Link to="/cadastrar" className="pro-cta">Assinar MyRank Pro</Link>

            <span className="pro-fineprint">
              O resto do MyRank continua 100% grátis, pra sempre.
            </span>
          </div>
        </section>

        {/* Benefícios */}
        <section className="pro-section">
          <div className="pro-benefits">
            {beneficios.map((b) => (
              <div key={b.title} className="pro-benefit">
                <div className="pro-benefit-icon">{b.icon}</div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparação Grátis vs Pro */}
        <section className="pro-section pro-compare-section">
          <div className="pro-compare-layout">
            <div className="pro-compare-copy">
              <h2 className="pro-compare-title">Grátis vs Pro</h2>
              <p className="pro-compare-lead">
                O núcleo do MyRank é grátis pra sempre — tabelas, ranking unificado e
                comparação com amigos. O Pro acrescenta a camada de IA que lê seu
                histórico e devolve perfil, padrões e sugestões.
              </p>

              <ul className="pro-compare-points">
                <li><CheckIcon size={16} />Plano grátis sem limite de uso</li>
                <li><CheckIcon size={16} />Assine e cancele quando quiser</li>
                <li><CheckIcon size={16} />Seus dados são seus — nunca vendidos</li>
              </ul>

              <div className="pro-compare-actions">
                <Link to="/cadastrar" className="pro-cta pro-cta--inline">Assinar MyRank Pro</Link>
                <Link to="/#faq" className="pro-faq-link pro-faq-link--inline">Ver perguntas frequentes</Link>
              </div>
            </div>

            <div className="pro-compare">
              <div className="pro-compare-row pro-compare-head">
                <span />
                <span className="pro-compare-col">Grátis</span>
                <span className="pro-compare-col is-pro">Pro</span>
              </div>

              {comparacao.map((row) => (
                <div key={row.feature} className="pro-compare-row">
                  <span className="pro-compare-feature">{row.feature}</span>
                  <span className="pro-compare-cell">
                    {row.free ? <CheckIcon color="#888" /> : <DashIcon />}
                  </span>
                  <span className="pro-compare-cell">
                    {row.pro ? <CheckIcon /> : <DashIcon />}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </main>
  );
};

export default ProPage;
