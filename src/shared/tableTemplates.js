/** Os identificadores são os mesmos da API; nome e emoji não determinam o tipo. */
export const TABLE_TEMPLATES = {
  movie: { emoji: '🎬', type: 'filme' },
  game: { emoji: '🎮', type: 'jogo' },
  tv: { emoji: '📺', type: 'serie' },
  book: { emoji: '📚', type: 'livro' },
  anime: { emoji: '🎌', type: 'anime' },
  music: { emoji: '🎵', type: 'musica', square: true, timeless: true },
  album: { emoji: '💿', type: 'album', square: true, timeless: true },
  custom: { emoji: '📦', type: 'outro' },
};

export function templateType(template) {
  return TABLE_TEMPLATES[template]?.type ?? 'outro';
}

export function templateProvider(template) {
  return {
    movie: 'tmdb', tv: 'tmdb', game: 'rawg', book: 'google-books', anime: 'myanimelist',
    music: 'deezer', album: 'deezer',
  }[template];
}

/** Música e álbum não usam ponderação por tempo (o backend também zera o bônus). */
export function isTimeWeighted(template) {
  return !TABLE_TEMPLATES[template]?.timeless;
}

/** Capa quadrada (disco) em vez de pôster 2:3. */
export function hasSquareCover(template) {
  return !!TABLE_TEMPLATES[template]?.square;
}

/**
 * Linha de apoio do card: o criador e, quando o template tem, o detalhe próprio
 * (de qual álbum é a faixa; quantas faixas tem o álbum).
 */
export function itemSubline(item, tracksLabel) {
  const details = item.details ?? {};
  let extra = null;
  if (item.template === 'music') extra = details.album;
  if (item.template === 'album' && details.trackCount) extra = tracksLabel.replace('{n}', details.trackCount);
  return [item.sub, extra].filter(Boolean).join(' · ');
}

/** Emoji automático só quando há um tipo de API; misturado ou Personalizado, a pessoa escolhe. */
export function needsCustomEmoji(templates) {
  return templates.length !== 1 || templates[0] === 'custom';
}
