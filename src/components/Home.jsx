import logo from '../assets/logo.png'

const medias = [
  { icon: "🎬", label: "Filmes" },
  { icon: "📺", label: "Séries" },
  { icon: "🎮", label: "Jogos" },
  { icon: "📚", label: "Livros" },
  { icon: "⛩️", label: "Animes" },
];

const posters = [
  "#1a0a2e", "#0a1a2e", "#2e1a0a", "#0a2e1a", "#2e0a1a",
  "#1a2e0a", "#0a0a2e", "#2e2e0a", "#0a2e2e", "#2e0a2e",
  "#1a1a0a", "#0a1a1a", "#2e1a1a", "#1a2e1a", "#1a1a2e",
  "#2e2e2e", "#0a2e0a", "#2e0a0a", "#0a0a0a", "#1a0a1a",
];

const Home = () => {
  return (
    <main style={{ backgroundColor: "#0f0f0f", minHeight: "100vh" }}>

      {/* Hero Section */}
      <section style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        overflow: "hidden",
        padding: "0 2rem",
      }}>

        {/* Poster grid background */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          gap: "6px",
          padding: "6px",
          zIndex: 0,
        }}>
          {posters.map((color, i) => (
            <div key={i} style={{
              backgroundColor: color,
              borderRadius: "6px",
              opacity: 0.6,
            }} />
          ))}
        </div>

        {/* Overlay escuro */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(15,15,15,0.6) 0%, rgba(15,15,15,0.85) 60%, #0f0f0f 100%)",
          zIndex: 1,
        }} />

        {/* Conteúdo */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
          <h1 style={{
            fontSize: "56px",
            fontWeight: "800",
            color: "#e5e5e5",
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: "1.15",
            maxWidth: "700px",
          }}>
            Seu gosto.<br />
            Seu ranking.<br />
            <span style={{ color: "#d4af37" }}>Sua identidade.</span>
          </h1>

          <p style={{
            fontSize: "16px",
            color: "#aaa",
            fontFamily: "'DM Sans', sans-serif",
            maxWidth: "480px",
            lineHeight: "1.7",
          }}>
            Avalie filmes, séries, jogos, livros e animes em um só lugar. Compare com amigos e descubra seu perfil de consumo.
          </p>

          <button style={{
            backgroundColor: "#d4af37",
            border: "none",
            borderRadius: "8px",
            color: "#0f0f0f",
            fontSize: "15px",
            fontWeight: "700",
            padding: "14px 36px",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            marginTop: "8px",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Criar conta grátis
          </button>

          {/* Cards de mídia */}
          <div style={{
            display: "flex",
            gap: "16px",
            marginTop: "24px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}>
            {medias.map((m) => (
              <div key={m.label} style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "16px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                fontFamily: "'DM Sans', sans-serif",
                color: "#e5e5e5",
                fontSize: "13px",
                fontWeight: "500",
              }}>
                <span style={{ fontSize: "28px" }}>{m.icon}</span>
                {m.label}
              </div>
            ))}
          </div>
        </div>

      </section>

  {/* Como funciona */}
<section style={{
  padding: "60px 2rem",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "40px",
}}>
  <h2 style={{
    fontSize: "36px",
    fontWeight: "800",
    color: "#e5e5e5",
    fontFamily: "'DM Sans', sans-serif",
    textAlign: "center",
  }}>
    Como funciona?
  </h2>

  <div style={{
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: "1000px",
  }}>
    {[
      {
        num: "01",
        title: "Monte suas tabelas",
        desc: "Crie tabelas do jeito que quiser — uma só de filmes, ou várias por categoria: Filmes de Ficção, Filmes de Máfia, Jogos de RPG. Você define a estrutura.",
      },
      {
        num: "02",
        title: "Avalie do seu jeito",
        desc: "Dê notas de 0 a 10 para filmes, séries, jogos, livros e animes. Registre também o tempo consumido — ele influencia sua nota final de forma justa.",
      },
      {
        num: "03",
        title: "Unifique tudo",
        desc: "Junte todas as suas tabelas em um ranking unificado com média ponderada. Compare obras de mídias diferentes e descubra o que realmente te marcou.",
      },
    ].map((step) => (
      <div key={step.num} style={{
        backgroundColor: "#1a1a1a",
        borderTop: "2px solid #d4af37",
        border: "1px solid #2a2a2a",
        borderRadius: "12px",
        padding: "28px",
        flex: "1",
        minWidth: "240px",
        maxWidth: "300px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}>
        <span style={{
          fontSize: "36px",
          fontWeight: "800",
          color: "#d4af37",
          fontFamily: "'DM Sans', sans-serif",
          opacity: 0.35,
          lineHeight: 1,
        }}>{step.num}</span>
        <h3 style={{
          fontSize: "18px",
          fontWeight: "700",
          color: "#e5e5e5",
          fontFamily: "'DM Sans', sans-serif",
        }}>{step.title}</h3>
        <p style={{
          fontSize: "14px",
          color: "#888",
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: "1.7",
        }}>{step.desc}</p>
      </div>
    ))}
  </div>
</section>

{/* Números de impacto */}
<section style={{
  padding: "60px 2rem",
  display: "flex",
  justifyContent: "center",
  gap: "64px",
  flexWrap: "wrap",
  borderTop: "1px solid #2a2a2a",
  borderBottom: "1px solid #2a2a2a",
}}>
  {[
    { num: "100%", label: "Gratuito" },
  { num: "99+", label: "Tabelas por usuário" },
  {num: "5", label: "Categorias de mídia"},
  { num: "99+", label: "Obras por tabela" },
  { num: "0–10", label: "Escala de avaliação" },
  ].map((item) => (
    <div key={item.label} style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
    }}>
      <span style={{
        fontSize: "48px",
        fontWeight: "800",
        color: "#d4af37",
        fontFamily: "'DM Sans', sans-serif",
        lineHeight: 1,
      }}>{item.num}</span>
      <span style={{
        fontSize: "14px",
        color: "#888",
        fontFamily: "'DM Sans', sans-serif",
      }}>{item.label}</span>
    </div>
  ))}
</section>

{/* CTA Final */}
<section style={{
  padding: "100px 2rem",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "24px",
  textAlign: "center",
}}>
  <h2 style={{
    fontSize: "40px",
    fontWeight: "800",
    color: "#e5e5e5",
    fontFamily: "'DM Sans', sans-serif",
    maxWidth: "600px",
    lineHeight: 1.2,
  }}>
    Pronto para montar o seu ranking?
  </h2>
  <p style={{
    fontSize: "15px",
    color: "#888",
    fontFamily: "'DM Sans', sans-serif",
    maxWidth: "440px",
    lineHeight: 1.7,
  }}>
    Gratuito, sem anúncios e do seu jeito.
  </p>
  <button style={{
    backgroundColor: "#d4af37",
    border: "none",
    borderRadius: "8px",
    color: "#0f0f0f",
    fontSize: "15px",
    fontWeight: "700",
    padding: "14px 36px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    marginTop: "8px",
  }}
    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
  >
    Criar conta grátis
  </button>
</section>

{/* Footer */}
<footer style={{
  borderTop: "1px solid #2a2a2a",
  padding: "40px 4rem 24px",
  display: "flex",
  flexDirection: "column",
  gap: "32px",
}}>
  
  <div style={{
    display: "flex",
    gap: "80px",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "flex-start",
  }}>

    {/* Coluna 1 — Logo */}
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "200px" }}>
    <img src={logo} alt="MyRank" style={{ height: "80px", objectFit: "contain" }} />
    <p style={{ fontSize: "14px", color: "#555", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, textAlign: "center"} }>
            Tudo em um só lugar.
     </p>
    </div>
     
    {/* Coluna 2 — Links */}
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <span style={{ fontSize: "11px", fontWeight: "700", color: "#555", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "1.5px" }}>Produto</span>
      {["Sobre", "Contato", "Termos de uso", "Privacidade"].map((link) => (
        <a key={link} href="#" style={{ fontSize: "14px", color: "#888", fontFamily: "'DM Sans', sans-serif", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e5e5e5")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
        >{link}</a>
      ))}
    </div>

    {/* Coluna 3 — Redes */}
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <span style={{ fontSize: "11px", fontWeight: "700", color: "#555", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "1.5px" }}>Redes</span>
      {[
        { label: "GitHub", href: "#", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#888"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg> },
        { label: "Instagram", href: "#", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="#888"/></svg> },
        { label: "LinkedIn", href: "#", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#888"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg> },
        { label: "WhatsApp", href: "#", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#888"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.112 1.523 5.84L.057 23.428a.5.5 0 0 0 .619.612l5.76-1.51A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 0 1-5.03-1.362l-.36-.214-3.733.979.995-3.64-.235-.374A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg> },
      ].map((rede) => (
        <a key={rede.label} href={rede.href} style={{ fontSize: "14px", color: "#888", fontFamily: "'DM Sans', sans-serif", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e5e5e5")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
        >{rede.icon}{rede.label}</a>
      ))}
    </div>

  </div>

  {/* Bottom */}
  <div style={{
    borderTop: "1px solid #2a2a2a",
    paddingTop: "20px",
    display: "flex",
    justifyContent: "center",
  }}>
    <span style={{ fontSize: "13px", color: "#444", fontFamily: "'DM Sans', sans-serif" }}>
      © 2026 MyRank. Todos os direitos reservados.
    </span>
  </div>

</footer>

    </main>
  )
}

export default Home