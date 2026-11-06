// O campo "criador" pode ter mais de uma pessoa: as APIs juntam com vírgula
// ("Vince Gilligan, Peter Gould") e quem digita à mão às vezes usa ";" ou " & ".
// Mesma regra do back (CreatorNames.java): quem agrupa por criador separa aqui,
// pra Better Call Saul contar pro Vince Gilligan junto com Breaking Bad. Não quebra
// no " e ": ele aparece dentro de nome de estúdio.

const SEPARATORS = /\s*(?:,|;|\s&\s)\s*/;

/** Chave de comparação: "Studio Pierrot" e "studio  pierrót" viram a mesma pessoa. */
export function creatorKey(name) {
  return String(name ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Cada pessoa do campo, sem espaços sobrando e sem repetir (na ordem em que aparecem). */
export function splitCreators(creator) {
  const byKey = new Map();
  for (const part of String(creator ?? '').trim().split(SEPARATORS)) {
    const name = part.replace(/\s+/g, ' ').trim();
    if (name && !byKey.has(creatorKey(name))) byKey.set(creatorKey(name), name);
  }
  return [...byKey.values()];
}
