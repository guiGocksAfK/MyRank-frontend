import api from './api'; // ajuste o caminho se o arquivo da instância axios tiver outro nome

/**
 * Busca filmes por título (autocomplete). Retorna lista de:
 * { externalId, title, posterUrl, releaseDate }
 */
export async function searchMovies(query) {
  const { data } = await api.get('/external/search/movies', { params: { query } });
  return data;
}

/**
 * Busca séries por título (autocomplete). Mesmo formato de retorno.
 */
export async function searchTvShows(query) {
  const { data } = await api.get('/external/search/tv', { params: { query } });
  return data;
}

/**
 * Detalhes completos de um filme já selecionado pelo usuário.
 * Retorna: { title, imageUrl, creator, releaseDate, timeMinutes }
 */
export async function getMovieDetails(externalId) {
  const { data } = await api.get(`/external/movies/${externalId}`);
  return data;
}

/**
 * Detalhes completos de uma série já selecionada pelo usuário.
 * Mesmo formato de retorno.
 */
export async function getTvShowDetails(externalId) {
  const { data } = await api.get(`/external/tv/${externalId}`);
  return data;
}

/**
 * Busca jogos por título (autocomplete). Mesmo formato de retorno.
 */
export async function searchGames(query) {
  const { data } = await api.get('/external/search/games', { params: { query } });
  return data;
}

/**
 * Detalhes completos de um jogo já selecionado pelo usuário.
 * Mesmo formato de retorno.
 */
export async function getGameDetails(externalId) {
  const { data } = await api.get(`/external/games/${externalId}`);
  return data;
}

/**
 * Dispara a busca certa de acordo com o tipo escolhido no dropdown do modal.
 * type: 'movie' | 'tv' | 'game'
 */
export async function searchByType(type, query) {
  if (type === 'movie') return searchMovies(query);
  if (type === 'tv') return searchTvShows(query);
  if (type === 'game') return searchGames(query);
  return [];
}

/**
 * Dispara a busca de detalhes certa de acordo com o tipo escolhido.
 * type: 'movie' | 'tv' | 'game'
 */
export async function getDetailsByType(type, externalId) {
  if (type === 'movie') return getMovieDetails(externalId);
  if (type === 'tv') return getTvShowDetails(externalId);
  if (type === 'game') return getGameDetails(externalId);
  return null;
}