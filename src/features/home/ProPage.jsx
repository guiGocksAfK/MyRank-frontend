import { Link } from "react-router-dom";

const CheckIcon = ({ size = 16, color = "#d4af37" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const DashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2.5" strokeLinecap="round">
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
    <main style={{
      minHeight: "100vh",
      color: "#e5e5e5",
      fontFamily: "'DM Sans', sans-serif",
      background:
        "linear-gradient(115deg, rgba(212, 175, 55, 0.16), rgba(0, 0, 0, 0) 34%), radial-gradient(circle at 80% 18%, rgba(212, 175, 55, 0.13), transparent 28%), #000",
    }}>

      <style>{`
        @keyframes proFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pro-fade-1 { animation: proFadeUp 0.55s ease both; }
        .pro-fade-2 { animation: proFadeUp 0.55s ease 0.08s both; }
        .pro-fade-3 { animation: proFadeUp 0.55s ease 0.16s both; }
        .pro-fade-4 { animation: proFadeUp 0.55s ease 0.24s both; }
        .pro-fade-5 { animation: proFadeUp 0.55s ease 0.32s both; }
        .pro-fade-6 { animation: proFadeUp 0.55s ease 0.4s both; }
        @media (prefers-reduced-motion: reduce) {
          .pro-fade-1, .pro-fade-2, .pro-fade-3, .pro-fade-4, .pro-fade-5, .pro-fade-6 {
            animation: none;
          }
        }
      `}</style>

      {/* Hero + card de preço, lado a lado */}
      <section style={{
        position: "relative",
        maxWidth: "1180px",
        margin: "0 auto",
        padding: "56px 24px 40px",
      }}>
        {/* glow ambiente */}
        <div style={{
          position: "absolute",
          top: "-40px",
          left: "-10%",
          width: "640px",
          height: "440px",
          background: "radial-gradient(ellipse, rgba(212,175,55,0.13), transparent 70%)",
          filter: "blur(10px)",
          zIndex: -1,
          pointerEvents: "none",
        }} />

        <div className="pro-hero-grid">
          {/* Coluna de texto */}
          <div className="pro-hero-copy">
            <Link
              to="/"
              className="pro-fade-1"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#888",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                padding: "8px 14px",
                transition: "color 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#e5e5e5";
                e.currentTarget.style.borderColor = "#555";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#888";
                e.currentTarget.style.borderColor = "#2a2a2a";
              }}
            >
              ← Voltar
            </Link>

            <span className="pro-fade-2" style={{
              color: "#d4af37",
              fontSize: "13px",
              fontWeight: "800",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginTop: "22px",
            }}>
              MyRank Pro
            </span>

            <h1 className="pro-fade-3" style={{
              fontSize: "clamp(30px, 4vw, 46px)",
              fontWeight: "800",
              lineHeight: "1.15",
              margin: "10px 0 0",
              color: "#f5f5f5",
            }}>
              Seu ranking mostra<br />o que você consumiu.<br />
              <span style={{ color: "#d4af37" }}>A IA mostra quem você é.</span>
            </h1>

            <p className="pro-fade-4" style={{
              fontSize: "16px",
              color: "#a5a5a5",
              lineHeight: "1.7",
              maxWidth: "440px",
              margin: "18px 0 0",
            }}>
              Uma IA analisa seu perfil completo e transforma isso em insights personalizados
              sobre o seu estilo, suas tendências e o que provavelmente vem a seguir.
            </p>

            {/* chips de destaque */}
            <div className="pro-fade-5 pro-chips" style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "22px",
            }}>
              {["Perfil por IA", "Sugestões personalizadas", "Atualização automática"].map((chip) => (
                <span key={chip} style={{
                  border: "1px solid rgba(212, 175, 55, 0.16)",
                  borderRadius: "999px",
                  background: "rgba(17, 17, 17, 0.82)",
                  color: "#d8d8d8",
                  padding: "9px 14px",
                  fontSize: "12px",
                  fontWeight: "700",
                  boxShadow: "0 6px 14px rgba(0, 0, 0, 0.18)",
                  transition: "border-color 0.16s ease, color 0.16s ease, background-color 0.16s ease",
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#f1d98a";
                    e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.42)";
                    e.currentTarget.style.backgroundColor = "rgba(24, 24, 24, 0.95)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#d8d8d8";
                    e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.16)";
                    e.currentTarget.style.backgroundColor = "rgba(17, 17, 17, 0.82)";
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Card de preço */}
          <div className="pro-fade-6" style={{ position: "relative" }}>
            <div style={{
              position: "absolute",
              top: "8%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "340px",
              height: "340px",
              background: "radial-gradient(circle, rgba(212,175,55,0.16), transparent 70%)",
              filter: "blur(10px)",
              zIndex: 0,
            }} />

            <div style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              background: "rgba(17, 17, 17, 0.94)",
              border: "1px solid rgba(212, 175, 55, 0.35)",
              borderRadius: "18px",
              padding: "36px 32px",
              boxShadow: "0 22px 70px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "22px",
              boxSizing: "border-box",
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "6px" }}>
                  <span style={{ fontSize: "clamp(38px, 6vw, 48px)", fontWeight: "800", color: "#d4af37", lineHeight: 1 }}>R$ 19,90</span>
                  <span style={{ fontSize: "15px", color: "#888" }}>/mês</span>
                </div>
                <span style={{ fontSize: "13px", color: "#666" }}>Cancele quando quiser</span>
              </div>

              <div style={{ height: "1px", background: "#2a2a2a" }} />

              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                {checklist.map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#d5d5d5" }}>
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to="/cadastrar"
                style={{
                  backgroundColor: "#d4af37",
                  border: "none",
                  borderRadius: "8px",
                  color: "#0f0f0f",
                  fontSize: "15px",
                  fontWeight: "700",
                  padding: "15px 0",
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.85";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(212,175,55,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                Assinar MyRank Pro
              </Link>

              <span style={{ fontSize: "12px", color: "#555", textAlign: "center" }}>
                O resto do MyRank continua 100% grátis, pra sempre.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios detalhados */}
      <section style={{
        padding: "56px 2rem 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "36px",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          width: "100%",
          maxWidth: "1240px",
        }}>
          {beneficios.map((b) => (
            <div key={b.title} style={{
              backgroundColor: "#111111",
              border: "1px solid #2a2a2a",
              borderRadius: "12px",
              padding: "26px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              transition: "all 0.2s",
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "rgba(212,175,55,0.5)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(212,175,55,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#2a2a2a";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(212, 175, 55, 0.1)",
                border: "1px solid rgba(212, 175, 55, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {b.icon}
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#e5e5e5", margin: 0 }}>{b.title}</h3>
              <p style={{ fontSize: "14px", color: "#888", lineHeight: "1.7", margin: 0 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparação Grátis vs Pro */}
      <section style={{
        padding: "56px 2rem 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "32px",
      }}>
        <h2 style={{
          fontSize: "clamp(24px, 4vw, 32px)",
          fontWeight: "800",
          color: "#e5e5e5",
          textAlign: "center",
          margin: 0,
        }}>
          Grátis vs Pro
        </h2>

        <div style={{
          width: "100%",
          maxWidth: "640px",
          border: "1px solid #2a2a2a",
          borderRadius: "14px",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 90px 90px",
            padding: "16px 24px",
            borderBottom: "1px solid #2a2a2a",
            backgroundColor: "#0d0d0d",
          }}>
            <span></span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#888", textAlign: "center" }}>Grátis</span>
            <span style={{ fontSize: "13px", fontWeight: "800", color: "#d4af37", textAlign: "center" }}>Pro</span>
          </div>

          {comparacao.map((row, i) => (
            <div key={row.feature} style={{
              display: "grid",
              gridTemplateColumns: "1fr 90px 90px",
              alignItems: "center",
              padding: "16px 24px",
              backgroundColor: i % 2 === 0 ? "#111111" : "#0d0d0d",
              borderBottom: i === comparacao.length - 1 ? "none" : "1px solid #232323",
            }}>
              <span style={{ fontSize: "14px", color: "#d5d5d5" }}>{row.feature}</span>
              <span style={{ display: "flex", justifyContent: "center" }}>
                {row.free ? <CheckIcon color="#888" /> : <DashIcon />}
              </span>
              <span style={{ display: "flex", justifyContent: "center" }}>
                {row.pro ? <CheckIcon /> : <DashIcon />}
              </span>
            </div>
          ))}
        </div>

        <Link to="/#faq" style={{ fontSize: "13px", color: "#666", textDecoration: "underline" }}>
          Ver perguntas frequentes
        </Link>
      </section>

    </main>
  );
};

export default ProPage;