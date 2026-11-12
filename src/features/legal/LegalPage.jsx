import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../shared/i18n';
import SiteFooter from '../../shared/components/SiteFooter';
import './legal.css';

const CONTACT_EMAIL = 'guigocksz@gmail.com';

// "{email}" no texto vira o link de contato
function withEmail(text) {
  const parts = String(text).split('{email}');
  return parts.flatMap((part, i) => (i === 0 ? [part] : [
    <a key={i} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>,
    part,
  ]));
}

/**
 * Termos de uso (`doc="terms"`) e Política de privacidade (`doc="privacy"`).
 * Em cima, as abas pra trocar entre os dois; em tela grande, um índice fixo à
 * esquerda. O texto inteiro mora no i18n (`t.legal`), nos três idiomas.
 */
export default function LegalPage({ doc }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const tl = t.legal;
  const page = tl[doc];

  useEffect(() => {
    document.title = `${page.title} · MyRank`;
    return () => { document.title = 'MyRank'; };
  }, [page.title]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [doc]);

  const jump = (n) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(`s${n}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  // volta pra tela de onde veio; aberta direto pelo link, vai pro início
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'));

  return (
    <>
      <main className="legal">
        <button type="button" className="legal-back" onClick={goBack}>
          <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
          {tl.back}
        </button>

        <nav className="legal-tabs" aria-label={tl.docs}>
          <NavLink to="/termos" replace className={({ isActive }) => `legal-tab${isActive ? ' is-active' : ''}`}>{tl.terms.title}</NavLink>
          <NavLink to="/privacidade" replace className={({ isActive }) => `legal-tab${isActive ? ' is-active' : ''}`}>{tl.privacy.title}</NavLink>
        </nav>

        <header className="legal-head">
          <h1>{page.title}</h1>
          <p>{tl.updated}</p>
        </header>

        <div className="legal-layout">
          <nav className="legal-toc" aria-label={tl.onThisPage}>
            <p>{tl.onThisPage}</p>
            <ol>
              {page.sections.map((s, i) => (
                <li key={s.h}>
                  {/* só rola até a seção: sem entrada no histórico, o Voltar continua indo pra tela de antes */}
                  <a href={`#s${i + 1}`} onClick={(e) => { e.preventDefault(); jump(i + 1); }}>{s.h}</a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="legal-body">
            <p className="legal-intro">{withEmail(page.intro)}</p>
            {page.sections.map((s, i) => (
              <section key={s.h} id={`s${i + 1}`} className="legal-section">
                <h2><span className="legal-num">{i + 1}</span>{s.h}</h2>
                {s.p?.map((p) => <p key={p}>{withEmail(p)}</p>)}
                {s.list && (
                  <ul>
                    {s.list.map((item) => <li key={item}>{withEmail(item)}</li>)}
                  </ul>
                )}
                {s.after?.map((p) => <p key={p}>{withEmail(p)}</p>)}
              </section>
            ))}
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
