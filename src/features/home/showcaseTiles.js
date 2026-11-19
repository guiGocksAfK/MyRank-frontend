import { getShowcasePosters } from "../../services/ExternalSearchService";
import { SHOWCASE_FALLBACK } from "./showcaseFallback";

export const POSTER_TILES = 20; // grid 5x4
const SHOWCASE_WAIT_MS = 600;   // espera curta pelo /showcase antes de decidir a lista

/** Junta os pôsteres ao vivo com o fallback estático, sem repetir, até 20 tiles. */
// Cada tile ocupa um quinto da tela e fica escurecido: miniaturas reduzem o peso no celular
// (TMDB de 500px -> 342px; RAWG original 1080p -> resize de 420px).
const smaller = (url) =>
  url
    .replace('image.tmdb.org/t/p/w500/', 'image.tmdb.org/t/p/w342/')
    .replace('media.rawg.io/media/games/', 'media.rawg.io/media/resize/420/-/games/')
    .replace('media.rawg.io/media/screenshots/', 'media.rawg.io/media/resize/420/-/screenshots/');

export const buildTiles = (live) => [...new Set([...live.map(smaller), ...SHOWCASE_FALLBACK])].slice(0, POSTER_TILES);

const testImage = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });

/**
 * Pré-carrega os pôsteres e substitui qualquer URL que falhou no navegador
 * por uma URL ainda não usada do fallback estático.
 */
export const preloadShowcaseTiles = async (tiles) => {
  const results = await Promise.all(tiles.map(testImage));
  if (results.every(Boolean)) return tiles;

  const used = new Set(tiles.filter((_, i) => results[i]));
  const spares = SHOWCASE_FALLBACK.filter((u) => !used.has(u));
  let spareIndex = 0;

  const verified = tiles.map((url, i) => (results[i] ? url : spares[spareIndex++] || url));
  resolvedTiles = verified;
  return verified;
};

// A lista é decidida uma vez por sessão e reaproveitada: a home e as telas de
// entrar/cadastrar mostram exatamente os mesmos pôsteres.
let decided = null;
let resolvedTiles = null;

/** Lista final de pôsteres: o /showcase se responder rápido, senão o fallback. */
export const loadShowcaseTiles = () => {
  decided ??= Promise.race([
    getShowcasePosters().catch(() => []),
    new Promise((resolve) => setTimeout(() => resolve(null), SHOWCASE_WAIT_MS)),
  ]).then((live) => {
    resolvedTiles = Array.isArray(live) && live.length ? buildTiles(live) : buildTiles([]);
    return resolvedTiles;
  });
  return decided;
};

/** A lista já decidida nesta sessão (ou null se ainda não carregou). */
export const getLoadedTiles = () => resolvedTiles;
