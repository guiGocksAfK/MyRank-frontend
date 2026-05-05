import logo from '../assets/logo.png'
import { useState } from "react";

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

const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        backgroundColor: open ? "#1a1a1a" : "#111111",
        border: `1px solid ${open ? "#d4af37" : "#2a2a2a"}`,
        borderRadius: "12px",
        padding: "24px 28px",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!open) e.currentTarget.style.borderColor = "#555";
      }}
      onMouseLeave={(e) => {
        if (!open) e.currentTarget.style.borderColor = "#2a2a2a";
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
      }}>
        <span style={{
          fontSize: "15px",
          fontWeight: "600",
          color: "#e5e5e5",
          fontFamily: "'DM Sans', sans-serif",
        }}>{question}</span>
        <span style={{
          color: "#d4af37",
          fontSize: "22px",
          fontWeight: "300",
          flexShrink: 0,
          transition: "transform 0.2s",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}>+</span>
      </div>
      {open && (
        <p style={{
          fontSize: "14px",
          color: "#888",
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: "1.7",
          marginTop: "16px",
        }}>{answer}</p>
      )}
    </div>
  );
};

const Home = () => {
  return (
    <main style={{ backgroundColor: "#000000", minHeight: "100vh" }}>

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
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.92)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
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
                     cursor: "pointer",
                     transition: "all 0.2s",
              }}
             onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(212,175,55,0.1)";
                e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.transform = "translateY(0)";
               }}
    >
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
    maxWidth: "1400px",
  }}>
   {[
  {
    num: "01",
    title: "Crie sua conta",
    desc: "Comece de graça, sem cartão e sem pegadinha. Acesso completo a todas as funcionalidades — suas tabelas, seu ranking e sua identidade, tudo seu desde o primeiro login.",
  },
  {
    num: "02",
    title: "Monte suas tabelas",
    desc: "Crie tabelas do jeito que fizer sentido pra você — uma só de séries, uma só de animes, ou misture os dois. Prefere separar por categoria? Animes Shonen, Animes de Sci-Fi, Filmes de Máfia. Você define a estrutura, sem limites.",
  },
  {
    num: "03",
    title: "Avalie do seu jeito",
    desc: "Dê notas de 0 a 10 para qualquer obra. Se quiser ir além, registre o tempo que dedicou — e a gente cria uma média ponderada especial, valorizando o que você realmente consumiu com atenção.",
  },
  {
    num: "04",
    title: "Unifique tudo",
    desc: "Junte as tabelas que quiser num ranking unificado com média ponderada — opcional, mas poderoso. Compare filmes com jogos, séries com animes, e descubra o que realmente te marcou.",
  },
    ].map((step) => (
          <div key={step.num} style={{
        backgroundColor: "#111111",
        borderTop: "2px solid #d4af37",
        border: "1px solid #2a2a2a",
        borderRadius: "12px",
        padding: "28px",
        flex: "1",
        minWidth: "240px",
        maxWidth: "320px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        cursor: "default",
        transition: "all 0.2s",
      }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-6px)";
          e.currentTarget.style.borderColor = "#d4af37";
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(212,175,55,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = "#2a2a2a";
          e.currentTarget.style.boxShadow = "none";
        }}
>
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

{/* FAQ */}
<section style={{
  padding: "80px 2rem",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "48px",
}}>
  <h2 style={{
    fontSize: "36px",
    fontWeight: "800",
    color: "#e5e5e5",
    fontFamily: "'DM Sans', sans-serif",
    textAlign: "center",
  }}>
    Perguntas frequentes
  </h2>

  <div style={{
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    maxWidth: "800px",
  }}>
    {[
      { q: "O MyRank é gratuito?", a: "Sim, 100% gratuito e sem anúncios. Criar conta, montar tabelas, avaliar obras, usar o ranking unificado e comparar com amigos não custa nada. Sempre." },
      { q: "Como funciona o ranking unificado?", a: "Você escolhe quais tabelas quer unir — pode ser todas de uma vez ou só uma seleção específica, como suas tabelas de filmes e séries juntas, ou filmes e jogos. O MyRank funde tudo em uma única lista ordenada, onde cada obra recebe sua posição com base na nota — e opcionalmente na média ponderada por tempo consumido. O resultado é um ranking personalizado que cruza mídias diferentes e mostra o que realmente ficou no topo da sua história como consumidor." },
      { q: "Como funciona a média ponderada por tempo?", a: "Quando você registra o tempo dedicado a uma obra, a nota recebe um bônus proporcional. Um filme de 2h com nota 8.0 praticamente não é afetado — continua quase o mesmo 8.0. Já uma série que você maratonou por 30h com nota 8.0 sobe para 8.3, reconhecendo o tempo real que você investiu. O bônus é calibrado para não distorcer as notas — obras longas sobem com justiça, obras curtas não são punidas." },
      { q: "Posso comparar meu ranking com o de amigos?", a: "Sim! Você pode seguir outros usuários e comparar suas notas individuais, rankings gerais e ver as últimas alterações que eles fizeram nas tabelas públicas deles. É a melhor forma de descobrir o que seus amigos estão consumindo e onde vocês concordam ou discordam." },
      { q: "As tabelas são públicas ou privadas?", a: "Você decide. Cada tabela pode ser configurada como pública — visível para seus seguidores — ou privada, visível só para você. Seu perfil também pode ser público ou privado, te dando controle total sobre o que compartilha." },
      { q: "Como é o dashboard visual?", a: "Suas obras são exibidas em um grid de posters — visual, organizado e fácil de navegar. Você também conta com filtros para ordenar por data de lançamento, data em que adicionou a obra, e até ver o que seus amigos mais consumiram." },
      { q: "Como as informações das obras são cadastradas?", a: "Automaticamente. O MyRank usa APIs externas para buscar os metadados de cada obra assim que você a adiciona — diretor do filme, produtora do jogo, autor do livro, estúdio do anime e muito mais. Você não precisa preencher nada na mão." },
      { q: "Existe um ranking por autor ou empresa?", a: "Sim! O MyRank gera rankings automáticos por criador — seja um diretor, uma produtora de jogos ou um autor de livros. Cada um recebe uma nota média ponderada, que favorece criadores com mais obras avaliadas por você. É a forma mais honesta de descobrir quem realmente domina o seu gosto." },
      { q: "Conquistas e badges", a: "O MyRank gera badges automáticos baseados no seu consumo. Maratonou mais de 500 horas em jogos? Você é um \"Maratonista de Elite\". Consumiu mais de 50 obras de ficção científica? Vira \"Explorador do Futuro\". Seu perfil vira um reflexo real do que você consome." },
      { q: "O que é o MyRank Pro?", a: "O MyRank Pro é o plano premium para quem quer ir além. Com ele, uma IA analisa seu perfil completo — suas notas, mídias favoritas e padrões de consumo — e gera insights personalizados: seu estilo como consumidor, suas tendências, e sugestões de próxima obra baseadas no seu ranking atual. O restante do site permanece 100% gratuito." },
    ].map((item, i) => (
      <FAQItem key={i} question={item.q} answer={item.a} />
    ))}
  </div>
</section>

{/* Footer */}
<footer style={{
  borderTop: "1px solid #2a2a2a",
  padding: "26px 6rem 24px",
  display: "flex",
  flexDirection: "column",
  gap: "48px",
}}>
  
<div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
}}>

  {/* Coluna 1 — Logo */}
  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "180px" }}>
    <img src={logo} alt="MyRank" style={{ height: "48px", objectFit: "contain" }} />
    <p style={{ fontSize: "13px", color: "#555", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, textAlign: "center" }}>
      Tudo em um só lugar.
    </p>
  </div>

  {/* Coluna 2 — Produto */}
  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
    <span style={{ fontSize: "11px", fontWeight: "700", color: "#555", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "1.5px" }}>Produto</span>
    {["Sobre", "Contato", "Termos de uso", "Privacidade"].map((link) => (
      <a key={link} href="#" style={{ fontSize: "14px", color: "#888", fontFamily: "'DM Sans', sans-serif", textDecoration: "none" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#e5e5e5")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
      >{link}</a>
    ))}
  </div>

  {/* Coluna 3 — MyRank Pro */}
  <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "200px" }}>
    <span style={{ fontSize: "11px", fontWeight: "700", color: "#555", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "1.5px" }}>MyRank Pro</span>
    <p style={{ fontSize: "13px", color: "#888", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7 }}>
      IA que analisa seu perfil e sugere obras baseadas no seu ranking.
    </p>
    <a href="#" style={{
      fontSize: "13px",
      fontWeight: "700",
      color: "#d4af37",
      fontFamily: "'DM Sans', sans-serif",
      textDecoration: "none",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >Saiba mais →</a>
  </div>

  {/* Coluna 4 — Redes */}
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