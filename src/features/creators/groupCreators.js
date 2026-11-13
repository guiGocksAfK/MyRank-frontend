import { creatorKey, splitCreators } from '../../shared/creatorNames';

/** Tipo de criador que cada template sugere (o usuário pode trocar no "Editar"). */
function creatorType(template) {
  return { book: 'Escritor', manga: 'Escritor', game: 'Studio', anime: 'Studio', movie: 'Diretor', tv: 'Diretor' }[template] ?? 'Criador';
}

/** Tipo predominante entre as obras de um criador. */
function dominantType(works) {
  const counts = {};
  works.forEach(w => {
    const type = creatorType(w.template);
    counts[type] = (counts[type] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Criador';
}

/**
 * Monta as entradas da tela de Criadores a partir das obras:
 * 1. cada pessoa do campo criador conta à parte (grafias iguais sem acento/maiúscula
 *    se juntam, com o nome do jeito mais usado);
 * 2. quem tem exatamente as mesmas obras vira uma entrada só ("David Benioff & D. B. Weiss");
 * 3. quem só tem obras que já estão todas com alguém de mais obras não ganha linha
 *    (Peter Gould fica dentro do Vince Gilligan: Better Call Saul "com Peter Gould").
 * Assim cada obra aparece uma vez, a não ser quando duas carreiras próprias se cruzam.
 */
export function groupCreators(works) {
  const people = new Map(); // chave → { spellings, works }
  for (const work of works) {
    for (const name of splitCreators(work.creator)) {
      const key = creatorKey(name);
      if (!people.has(key)) people.set(key, { key, spellings: new Map(), works: new Map() });
      const person = people.get(key);
      person.spellings.set(name, (person.spellings.get(name) ?? 0) + 1);
      person.works.set(work.id, work);
    }
  }

  // 2. mesmas obras = mesma entrada
  const bySignature = new Map();
  for (const person of people.values()) {
    const member = {
      key: person.key,
      name: [...person.spellings].sort((a, b) => b[1] - a[1])[0][0],
      works: [...person.works.values()],
    };
    const signature = member.works.map(w => w.id).sort().join(',');
    if (!bySignature.has(signature)) bySignature.set(signature, []);
    bySignature.get(signature).push(member);
  }

  // 3. quem cabe inteiro dentro de alguém maior some (entra como "com fulano" lá)
  const candidates = [...bySignature.values()]
    .map(members => ({ members, works: members[0].works, ids: new Set(members[0].works.map(w => w.id)) }))
    .sort((a, b) => b.works.length - a.works.length);
  const kept = [];
  for (const entry of candidates) {
    const host = kept.find(other => other.works.length > entry.works.length && entry.works.every(w => other.ids.has(w.id)));
    if (!host) kept.push(entry);
  }

  return kept.map(({ members, works: entryWorks }) => {
    const memberKeys = new Set(members.map(m => m.key));
    // em cada obra, quem mais assina e não é desta entrada
    const coCredits = {};
    for (const work of entryWorks) {
      const others = splitCreators(work.creator).filter(name => !memberKeys.has(creatorKey(name)));
      if (others.length) coCredits[work.id] = others;
    }
    return {
      id: members.map(m => m.key).join('+'),
      members,
      name: members.map(m => m.name).join(' & '),
      works: entryWorks,
      count: entryWorks.length,
      autoType: dominantType(entryWorks),
      coCredits,
    };
  });
}
