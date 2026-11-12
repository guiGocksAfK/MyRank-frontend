import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { LANGUAGES as LANGS, STORAGE_KEY, dictOf, loadLanguage, readStoredLang } from './locales/load';

/**
 * i18n mínimo, sem lib. Traduzido: Home, páginas de auth e painel de Perfil.
 * O idioma fica em localStorage (myrank_lang) para resposta imediata e, quando
 * o usuário está logado, é persistido em users.language via PUT /users/me.
 * Os textos ficam um arquivo por idioma em ./locales (ver load.js).
 */

export const LANGUAGES = LANGS;

const LanguageContext = createContext(null);

const LOCALES = { PT: 'pt-BR', EN: 'en-US', ES: 'es-ES' };

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);
  // textos na tela: os do idioma escolhido, se já baixados; senão ficam os atuais até chegar
  const [dict, setDict] = useState(() => dictOf(lang));

  useEffect(() => {
    let active = true;
    loadLanguage(lang)
      .then((next) => { if (active) setDict(next); })
      .catch(() => { /* sem rede: continua no idioma que já está na tela */ });
    return () => { active = false; };
  }, [lang]);

  /**
   * @param next  'PT' | 'EN' | 'ES'
   * @param opts.persist  quando true (default) e há sessão, salva em users.language.
   *   Passe false ao sincronizar a partir do /users/me (evita PUT redundante).
   */
  const setLang = useCallback((next, opts = {}) => {
    if (!LANGUAGES.includes(next)) return;
    setLangState((current) => {
      if (current === next) return current;
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignora */ }
      return next;
    });

    const persist = opts.persist !== false;
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignora */ }
      if (localStorage.getItem('myrank_token')) {
        api.put('/users/me', { language: next }).catch(() => { /* best-effort */ });
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang.toLowerCase();
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: dict,
      locale: LOCALES[lang] || LOCALES.PT,
    }),
    [lang, setLang, dict],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback seguro se algum componente for montado fora do provider.
    return { lang: 'PT', setLang: () => {}, t: dictOf('PT'), locale: 'pt-BR' };
  }
  return ctx;
}
