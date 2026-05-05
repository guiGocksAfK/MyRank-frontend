import { useState } from "react";

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const Navbar = () => {
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("PT");

  const languages = ["PT", "EN", "ES"];

  return (
    <nav
      style={{
        backgroundColor: "#0f0f0f",
        borderBottom: "1px solid #2a2a2a",
        padding: "0 2rem",
        height: "80px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "'DM Sans', sans-serif",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo — atalho para Home */}
      <a
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          textDecoration: "none",
        }}
      >
        <span style={{ fontSize: "26px", fontWeight: "700", color: "#e5e5e5", letterSpacing: "-0.5px" }}>My</span>
        <span style={{ fontSize: "26px", fontWeight: "700", color: "#d4af37", letterSpacing: "-0.5px" }}>Rank</span>
      </a>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>

        {/* Home link */}
        <a
          href="/"
          style={{
            color: "#888",
            fontSize: "15px",
            fontWeight: "500",
            textDecoration: "none",
            padding: "7px 4px",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e5e5e5")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
        >
          Home
        </a>

        {/* Language selector */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #2a2a2a",
              borderRadius: "6px",
              color: "#888",
              fontSize: "15px",
              padding: "6px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "border-color 0.2s",
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#555")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
          >
            {lang}
            <span style={{ fontSize: "10px", opacity: 0.6 }}>▼</span>
          </button>

          {langOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                backgroundColor: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "6px",
                overflow: "hidden",
                zIndex: 200,
                minWidth: "70px",
              }}
            >
              {languages.map((l) => (
                <button
                  key={l}
                  onClick={() => { setLang(l); setLangOpen(false); }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 14px",
                    backgroundColor: l === lang ? "#2a2a2a" : "transparent",
                    border: "none",
                    color: l === lang ? "#d4af37" : "#888",
                    fontSize: "13px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={(e) => l !== lang && (e.currentTarget.style.backgroundColor = "#222")}
                  onMouseLeave={(e) => l !== lang && (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Entrar — sutil */}
        <button
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#888",
            fontSize: "15px",
            fontWeight: "500",
            padding: "7px 12px",
            cursor: "pointer",
            transition: "color 0.2s",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e5e5e5")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Entrar
        </button>

        {/* Cadastrar — destaque */}
        <button
          style={{
            backgroundColor: "#d4af37",
            border: "none",
            borderRadius: "6px",
            color: "#0f0f0f",
            fontSize: "15px",
            fontWeight: "700",
            padding: "7px 16px",
            cursor: "pointer",
            transition: "opacity 0.2s",
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.1s",
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
          Cadastrar
        </button>

        {/* Ícone de usuário — mais no canto */}
        <button
          style={{
            backgroundColor: "transparent",
            border: "1px solid #2a2a2a",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#555")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
        >
          <UserIcon />
        </button>

      </div>
    </nav>
  );
};

export default Navbar;