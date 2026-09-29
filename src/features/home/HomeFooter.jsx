import "./homeFooter.css";

// Assinatura do autor no rodapé (não são "redes do MyRank").
const CONTACT_EMAIL = "guigocksz@gmail.com";
const AUTHOR = "Guilherme Gocks";
const AUTHOR_LINKS = [
  {
    label: "GitHub",
    href: "https://github.com/guiGocksAfK",
    icon: <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/guilherme-gabriel-gocks-023846352/",
    icon: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </>
    ),
  },
];

/** Rodapé mínimo: os créditos acima já fecham a página, aqui só o essencial. */
const HomeFooter = ({ footer }) => (
  <footer className="sf">
    <div className="sf-inner">
      <div className="sf-brand">
        <span className="sf-logo">
          My<span>Rank</span>
        </span>
        <span>© {new Date().getFullYear()}</span>
      </div>

      <nav className="sf-links">
        <a href="#">{footer.terms}</a>
        <a href="#">{footer.privacy}</a>
        <a href={`mailto:${CONTACT_EMAIL}`}>{footer.contact}</a>
      </nav>

      <div className="sf-author">
        <span>
          {footer.madeBy} <b>{AUTHOR}</b>
        </span>
        {AUTHOR_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${link.label} ${AUTHOR}`}
            title={link.label}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {link.icon}
            </svg>
          </a>
        ))}
      </div>
    </div>
  </footer>
);

export default HomeFooter;
