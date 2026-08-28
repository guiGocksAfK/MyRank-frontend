import api from "./api";

/**
 * Catálogo de badges + progresso do usuário logado.
 * O backend recalcula o progresso a cada chamada, então é sempre fresco.
 */
export const getBadges = async () => {
  const res = await api.get("/badges");
  return res.data;
};
