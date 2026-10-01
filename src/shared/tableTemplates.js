/** Os identificadores são os mesmos da API; nome e emoji não determinam o tipo. */
export const TABLE_TEMPLATES = {
  movie: { emoji: '🎬', type: 'filme' },
  game: { emoji: '🎮', type: 'jogo' },
  tv: { emoji: '📺', type: 'serie' },
  book: { emoji: '📚', type: 'livro' },
  anime: { emoji: '🎌', type: 'anime' },
  manga: { emoji: '📖', type: 'manga', timeless: true },
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
    music: 'deezer', album: 'deezer', manga: 'myanimelist',
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
 * (de qual álbum é a faixa; quantas faixas tem o álbum; volumes e situação do mangá).
 * `tr` = t.rankings.
 */
export function itemSubline(item, tr) {
  const details = item.details ?? {};
  const extras = [];
  if (item.template === 'music') extras.push(details.album);
  if (item.template === 'album' && details.trackCount) extras.push(tr.tracks.replace('{n}', details.trackCount));
  if (item.template === 'manga') {
    if (details.volumes) extras.push(tr.volumes.replace('{n}', details.volumes));
    extras.push(tr.mangaStatus[details.status]);
  }
  return [item.sub, ...extras].filter(Boolean).join(' · ');
}

/** Emoji automático só quando há um tipo de API; misturado ou Personalizado, a pessoa escolhe. */
export function needsCustomEmoji(templates) {
  return templates.length !== 1 || templates[0] === 'custom';
}
