/** Os identificadores são os mesmos da API; nome e emoji não determinam o tipo. */
export const TABLE_TEMPLATES = {
  movie: { emoji: '🎬', type: 'filme' },
  game: { emoji: '🎮', type: 'jogo' },
  tv: { emoji: '📺', type: 'serie' },
  book: { emoji: '📚', type: 'livro' },
  anime: { emoji: '🎌', type: 'anime' },
  custom: { emoji: '📦', type: 'outro' },
};

export function templateType(template) {
  return TABLE_TEMPLATES[template]?.type ?? 'outro';
}

export function templateProvider(template) {
  return { movie: 'tmdb', tv: 'tmdb', game: 'rawg', book: 'google-books', anime: 'myanimelist' }[template];
}

/** Emoji automático só quando há um tipo de API; misturado ou Personalizado, a pessoa escolhe. */
export function needsCustomEmoji(templates) {
  return templates.length !== 1 || templates[0] === 'custom';
}
