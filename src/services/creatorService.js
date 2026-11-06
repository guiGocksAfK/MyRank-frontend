import api from "./api";

/**
 * Foto (automática da TMDB ou a do usuário) e tipo escolhido de cada criador.
 * creators: [{ name, kind: 'PERSON' | 'COMPANY' }]. Itens com `pending` ainda não
 * tiveram a foto procurada: a tela pede de novo depois.
 */
export const getCreatorProfiles = async (creators) => {
  const res = await api.post("/creators/profiles", { creators });
  return res.data;
};

/** Edita a foto e/ou o tipo de um criador (só pro usuário). Vazio volta pro automático. */
export const updateCreatorProfile = async ({ name, photoUrl, type, kind }) => {
  const res = await api.put("/creators/profile", { name, photoUrl, type, kind });
  return res.data;
};
