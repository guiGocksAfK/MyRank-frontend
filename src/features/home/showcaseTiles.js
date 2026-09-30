import { getShowcasePosters } from "../../services/ExternalSearchService";
import { SHOWCASE_FALLBACK } from "./showcaseFallback";

export const POSTER_TILES = 20; // grid 5x4
const SHOWCASE_WAIT_MS = 600;   // espera curta pelo /showcase antes de decidir a lista

/** Junta os pôsteres ao vivo com o fallback estático, sem repetir, até 20 tiles. */
export const buildTiles = (live) => [...new Set([...live, ...SHOWCASE_FALLBACK])].slice(0, POSTER_TILES);

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
