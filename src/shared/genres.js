/**
 * Gêneros vêm de cada fonte num idioma e num nome (TMDB em PT, MyAnimeList e
 * RAWG em inglês, TMDB de série com "Action & Adventure"). Aqui todos viram uma
 * chave só; o nome mostrado sai do i18n (t.rankings.genreNames).
 * Gênero desconhecido continua aparecendo, com o nome que veio.
 */

const norm = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

const ALIASES = {
  action: ['action', 'acao'],
  adventure: ['adventure', 'aventura'],
  animation: ['animation', 'animacao'],
  comedy: ['comedy', 'comedia'],
  crime: ['crime'],
  documentary: ['documentary', 'documentario'],
  drama: ['drama'],
  family: ['family', 'familia', 'kids', 'infantil'],
  fantasy: ['fantasy', 'fantasia'],
  history: ['history', 'historia', 'historical', 'historico'],
  horror: ['horror', 'terror'],
  music: ['music', 'musica', 'musical'],
  mystery: ['mystery', 'misterio'],
  romance: ['romance'],
  scifi: ['science fiction', 'ficcao cientifica', 'sci-fi', 'scifi'],
  thriller: ['thriller', 'suspense'],
  war: ['war', 'guerra'],
  western: ['western', 'faroeste'],
  sports: ['sports', 'sport', 'esporte', 'esportes'],
  sliceOfLife: ['slice of life'],
  supernatural: ['supernatural', 'sobrenatural'],
  psychological: ['psychological', 'psicologico'],
  fiction: ['fiction', 'ficcao', 'juvenile fiction'],
  rpg: ['rpg', 'role-playing games (rpg)'],
  shooter: ['shooter'],
  strategy: ['strategy', 'estrategia'],
  puzzle: ['puzzle'],
  platformer: ['platformer'],
  racing: ['racing', 'corrida'],
  simulation: ['simulation', 'simulacao'],
  indie: ['indie'],
  fighting: ['fighting', 'luta'],
  shounen: ['shounen', 'shonen'],
  seinen: ['seinen'],
  shoujo: ['shoujo', 'shojo'],
  // temas do MyAnimeList e gêneros soltos do RAWG que aparecem bastante
  military: ['military', 'militar'],
  survival: ['survival', 'sobrevivencia'],
  gore: ['gore'],
  mecha: ['mecha'],
  isekai: ['isekai'],
  school: ['school', 'escolar'],
  martialArts: ['martial arts', 'artes marciais'],
  superPower: ['super power', 'superpoderes'],
  mythology: ['mythology', 'mitologia'],
  timeTravel: ['time travel', 'viagem no tempo'],
  arcade: ['arcade'],
  casual: ['casual'],
};

// nomes que juntam dois gêneros (gêneros de série do TMDB)
const COMBOS = {
  'action & adventure': ['action', 'adventure'],
  'sci-fi & fantasy': ['scifi', 'fantasy'],
  'war & politics': ['war'],
};

// rótulos de premiação, não são gênero
const IGNORED = new Set(['award winning']);

const KEY_BY_ALIAS = new Map(Object.entries(ALIASES).flatMap(([key, names]) => names.map(name => [name, key])));

/** Lista crua da API → chaves únicas ("raw:Nome" pro que não está na tabela). */
export function genreKeys(rawList) {
  if (!Array.isArray(rawList)) return [];
  const keys = new Set();
  rawList.forEach(raw => {
    const name = norm(raw);
    if (!name || IGNORED.has(name)) return;
    if (COMBOS[name]) COMBOS[name].forEach(key => keys.add(key));
    else keys.add(KEY_BY_ALIAS.get(name) ?? `raw:${String(raw).trim()}`);
  });
  return [...keys];
}

export function genreLabel(key, names = {}) {
  return names[key] ?? key.replace(/^raw:/, '');
}
