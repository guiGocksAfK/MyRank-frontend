import { formatTime } from '../utils/formatters';

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

const plural = (forms, n) => (n === 1 ? forms[0] : forms[1]).replace('{n}', n);

/**
 * Linha de apoio do card nas tabelas e no ranking unificado: o criador e os
 * detalhes que a API trouxe pro template. `tr` = t.rankings. Obras antigas, sem
 * details, mostram só o criador. (No perfil e no social continua só o criador.)
 */
export function itemSubline(item, tr) {
  const d = item.details ?? {};
  const year = item.releaseDate ? String(item.releaseDate).slice(0, 4) : null;
  const status = tr.workStatus[d.status];
  const u = tr.units;
  let parts;
  switch (item.template) {
    case 'movie':
      parts = [item.sub, year, item.timeMinutes > 0 && formatTime(item.timeMinutes)];
      break;
    case 'tv':
      parts = [item.sub, d.seasons && plural(u.seasons, d.seasons), status];
      break;
    case 'anime': {
      // Filme, OVA etc. dizem mais que o nº de episódios; série de TV mostra episódios.
      const kind = d.mediaType && d.mediaType !== 'tv' && (tr.mediaTypes[d.mediaType] ?? d.mediaType.toUpperCase());
      parts = kind
        ? [kind, item.sub]
        : [item.sub, d.episodes && plural(u.episodes, d.episodes), status];
      break;
    }
    case 'game':
      parts = [item.sub, year];
      break;
    case 'book':
      parts = [item.sub, d.pages && plural(u.pages, d.pages)];
      break;
    case 'music':
      parts = [item.sub, d.album];
      break;
    case 'album':
      parts = [item.sub, d.trackCount && plural(u.tracks, d.trackCount)];
      break;
    case 'manga':
      parts = [item.sub, d.volumes && plural(u.volumes, d.volumes), status];
      break;
    default:
      parts = [item.sub];
  }
  return parts.filter(Boolean).join(' · ');
}

/** Emoji automático só quando há um tipo de API; misturado ou Personalizado, a pessoa escolhe. */
export function needsCustomEmoji(templates) {
  return templates.length !== 1 || templates[0] === 'custom';
}
