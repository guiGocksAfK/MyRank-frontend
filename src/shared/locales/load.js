import PT from './pt';

export const STORAGE_KEY = 'myrank_lang';
export const LANGUAGES = ['PT', 'EN', 'ES'];

// Um arquivo por idioma. O português vai junto com o site (é o padrão e o de
// quase todo mundo); inglês e espanhol só são baixados por quem usa.
const LOADERS = {
  EN: () => import('./en'),
  ES: () => import('./es'),
};
const loaded = { PT };

/** Textos do idioma se já estiverem baixados; senão, os em português. */
export function dictOf(lang) {
  return loaded[lang] || loaded.PT;
}

/** Garante que os textos do idioma estão baixados. Devolve o dicionário. */
export function loadLanguage(lang) {
  if (loaded[lang]) return Promise.resolve(loaded[lang]);
  if (!LOADERS[lang]) return Promise.resolve(loaded.PT);
  return LOADERS[lang]().then((mod) => {
    loaded[lang] = mod.default;
    return mod.default;
  });
}

export function readStoredLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.includes(saved)) return saved;
  } catch {
    /* localStorage indisponível */
  }
  return 'PT';
}
