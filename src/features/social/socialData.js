/**
 * Camada de dados da aba Social — MOCK.
 *
 * Os shapes aqui espelham o contrato que a API REST vai expor
 * (GET /api/social/feed, /api/social/users/:id, POST /api/social/takes, ...).
 * Quando o backend existir, basta trocar o corpo de `socialApi.*` por
 * chamadas axios; os componentes não mudam.
 */

const REACT_KINDS = ['up', 'agree', 'disagree'];

const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString();
const daysAgo = (d) => new Date(Date.now() - d * 86_400_000).toISOString();

const seedReactions = (up = 0, agree = 0, disagree = 0) => ({
  up,
  agree,
  disagree,
  mine: null,
});

// ─── Usuários ────────────────────────────────────────────────────────────────
// `works`: obras avaliadas (title/type/score). O resto (top, breakdown) é derivado.

const RAW_USERS = [
  {
    id: 'u_joao',
    username: 'João Silva',
    handle: 'joaosilva',
    color: '#3b5bdb',
    bio: 'Ficção científica, soulslike e um TBR que só cresce.',
    plan: 'FREE',
    following: true,
    followsYou: true,
    badges: [
      { icon: '🎬', name: 'Cinéfilo' },
      { icon: '🏆', name: 'Platina' },
      { icon: '🧩', name: 'Polivalente' },
    ],
    works: [
      { title: 'The Witcher 3', type: 'jogo', score: 9.8 },
      { title: 'Interstellar', type: 'filme', score: 9.5 },
      { title: 'Elden Ring', type: 'jogo', score: 9.0 },
      { title: 'Breaking Bad', type: 'serie', score: 9.2 },
      { title: 'Duna', type: 'filme', score: 8.7 },
      { title: 'Dark Souls III', type: 'jogo', score: 8.9 },
      { title: 'O Problema dos 3 Corpos', type: 'livro', score: 8.4 },
    ],
  },
  {
    id: 'u_maria',
    username: 'Maria Oliveira',
    handle: 'mariaoliveira',
    color: '#0ca678',
    bio: 'Séries de prestígio > tudo. Também jogo cozy games.',
    plan: 'PRO',
    following: true,
    followsYou: false,
    badges: [
      { icon: '📺', name: 'Rei do sofá' },
      { icon: '🌟', name: 'Perto da perfeição' },
    ],
    works: [
      { title: 'Breaking Bad', type: 'serie', score: 10.0 },
      { title: 'The Last of Us', type: 'serie', score: 9.6 },
      { title: 'Duna: Parte Dois', type: 'filme', score: 9.3 },
      { title: 'Interstellar', type: 'filme', score: 8.9 },
      { title: 'Stardew Valley', type: 'jogo', score: 9.1 },
      { title: 'Elden Ring', type: 'jogo', score: 8.4 },
      { title: 'A Guerra dos Tronos (livro)', type: 'livro', score: 8.8 },
    ],
  },
  {
    id: 'u_carlos',
    username: 'Carlos Santos',
    handle: 'carlossantos',
    color: '#e67700',
    bio: 'Só jogo. Às vezes vejo um filme.',
    plan: 'FREE',
    following: true,
    followsYou: true,
    badges: [{ icon: '🎮', name: 'Gamer de carteirinha' }],
    works: [
      { title: 'Elden Ring', type: 'jogo', score: 9.1 },
      { title: 'The Witcher 3', type: 'jogo', score: 9.5 },
      { title: 'God of War Ragnarök', type: 'jogo', score: 9.0 },
      { title: 'Interstellar', type: 'filme', score: 7.2 },
      { title: 'Breaking Bad', type: 'serie', score: 8.1 },
      { title: 'Duna', type: 'filme', score: 6.9 },
    ],
  },
  {
    id: 'u_ana',
    username: 'Ana Costa',
    handle: 'anacosta',
    color: '#9c36b5',
    bio: 'Anime, mangá e literatura japonesa.',
    plan: 'PRO',
    following: false,
    followsYou: true,
    badges: [
      { icon: '⛩️', name: 'Otaku assumido' },
      { icon: '🎇', name: 'Peak fiction' },
    ],
    works: [
      { title: 'Frieren', type: 'anime', score: 9.7 },
      { title: 'Vinland Saga', type: 'anime', score: 9.4 },
      { title: 'Cowboy Bebop', type: 'anime', score: 9.2 },
      { title: 'Interstellar', type: 'filme', score: 9.0 },
      { title: 'Norwegian Wood', type: 'livro', score: 8.6 },
    ],
  },
  {
    id: 'u_rafa',
    username: 'Rafael Lima',
    handle: 'rafalima',
    color: '#1c7ed6',
    bio: 'Cinema autoral e RPGs longos.',
    plan: 'FREE',
    following: false,
    followsYou: false,
    badges: [{ icon: '🎞️', name: 'Preto e branco' }],
    works: [
      { title: 'Interstellar', type: 'filme', score: 8.2 },
      { title: 'Duna', type: 'filme', score: 9.1 },
      { title: 'Elden Ring', type: 'jogo', score: 9.3 },
      { title: 'Disco Elysium', type: 'jogo', score: 9.8 },
    ],
  },
  {
    id: 'u_bia',
    username: 'Beatriz Rocha',
    handle: 'biarocha',
    color: '#e64980',
    bio: 'Um pouco de tudo, muita opinião.',
    plan: 'FREE',
    following: false,
    followsYou: false,
    badges: [{ icon: '💯', name: 'Centurião' }],
    works: [
      { title: 'Breaking Bad', type: 'serie', score: 9.0 },
      { title: 'The Witcher 3', type: 'jogo', score: 8.6 },
      { title: 'Duna: Parte Dois', type: 'filme', score: 9.5 },
      { title: 'Frieren', type: 'anime', score: 9.1 },
    ],
  },
];

const TYPE_ICON = {
  jogo: '🎮',
  filme: '🎬',
  serie: '📺',
  livro: '📚',
  anime: '🌸',
  outro: '📦',
};

function decorateUser(u) {
  const top = [...u.works].sort((a, b) => b.score - a.score);
  const breakdown = {};
  u.works.forEach((w) => {
    breakdown[w.type] = (breakdown[w.type] || 0) + 1;
  });
  const avgScore =
    u.works.reduce((s, w) => s + w.score, 0) / (u.works.length || 1);
  return {
    ...u,
    initials: u.username
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase(),
    stats: { works: u.works.length, avgScore: +avgScore.toFixed(1) },
    top,
    breakdown,
  };
}

// estado mutável em memória (persiste durante a sessão)
let users = RAW_USERS.map(decorateUser);

// ─── Feed ────────────────────────────────────────────────────────────────────
// type: RATED | ADDED | MOVED_TOP | BADGE | TAKE | WEEKLY

let feed = [
  {
    id: 'a1',
    type: 'RATED',
    actorId: 'u_joao',
    createdAt: minutesAgo(2),
    work: { title: 'Interstellar', type: 'filme', score: 9.5 },
    reactions: seedReactions(3, 5, 1),
  },
  {
    id: 'a2',
    type: 'ADDED',
    actorId: 'u_maria',
    createdAt: minutesAgo(14),
    work: { title: 'Duna: Parte Dois', type: 'filme', score: 9.3 },
    reactions: seedReactions(2, 1, 0),
  },
  {
    id: 'a3',
    type: 'TAKE',
    actorId: 'u_carlos',
    createdAt: minutesAgo(38),
    work: { title: 'Elden Ring', type: 'jogo', score: 9.1 },
    text: 'Melhor mundo aberto já feito. O level design faz você QUERER explorar, não te obriga com ícone no mapa.',
    reactions: seedReactions(8, 6, 2),
  },
  {
    id: 'a4',
    type: 'BADGE',
    actorId: 'u_maria',
    createdAt: minutesAgo(70),
    badge: { icon: '🌟', name: 'Perto da perfeição' },
    reactions: seedReactions(4, 0, 0),
  },
  {
    id: 'a5',
    type: 'MOVED_TOP',
    actorId: 'u_ana',
    createdAt: daysAgo(1),
    work: { title: 'Frieren', type: 'anime', score: 9.7 },
    reactions: seedReactions(6, 9, 0),
  },
  {
    id: 'a6',
    type: 'TAKE',
    actorId: 'u_ana',
    createdAt: daysAgo(1),
    work: { title: 'Cowboy Bebop', type: 'anime', score: 9.2 },
    text: 'Envelheceu melhor que 90% do que sai hoje. Trilha sonora carrega episódios inteiros.',
    reactions: seedReactions(5, 4, 1),
  },
  {
    id: 'a7',
    type: 'WEEKLY',
    actorId: 'u_joao',
    createdAt: daysAgo(2),
    summary: { count: 6 },
    reactions: seedReactions(1, 0, 0),
  },
  {
    id: 'a8',
    type: 'RATED',
    actorId: 'u_carlos',
    createdAt: daysAgo(2),
    work: { title: 'God of War Ragnarök', type: 'jogo', score: 9.0 },
    reactions: seedReactions(2, 3, 1),
  },
];

// ─── helpers ────────────────────────────────────────────────────────────────

const clone = (v) => JSON.parse(JSON.stringify(v));
const wait = (v, ms = 120) => new Promise((r) => setTimeout(() => r(clone(v)), ms));

const userRef = (u) => ({
  id: u.id,
  username: u.username,
  handle: u.handle,
  initials: u.initials,
  color: u.color,
  bio: u.bio,
  plan: u.plan,
  stats: u.stats,
  following: u.following,
  followsYou: u.followsYou,
});

const normTitle = (t) => (t || '').trim().toLowerCase();

/** % de afinidade entre "minhas obras" (dados reais) e as de outro usuário. */
export function computeTasteMatch(myItems = [], theirWorks = []) {
  const mine = new Map(myItems.map((i) => [normTitle(i.title), Number(i.note)]));
  const shared = [];
  theirWorks.forEach((w) => {
    const myScore = mine.get(normTitle(w.title));
    if (Number.isFinite(myScore)) {
      shared.push({
        title: w.title,
        type: w.type,
        mine: myScore,
        theirs: w.score,
        diff: +(myScore - w.score).toFixed(1),
      });
    }
  });

  if (shared.length === 0) {
    return { sharedCount: 0, matchPct: null, agreements: [], disagreements: [], favorites: [] };
  }

  const meanAbs = shared.reduce((s, r) => s + Math.abs(r.diff), 0) / shared.length;
  const matchPct = Math.max(0, Math.min(100, Math.round(100 - meanAbs * 12)));
  const byAgree = [...shared].sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff));
  const byDisagree = [...shared].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  return {
    sharedCount: shared.length,
    matchPct,
    agreements: byAgree.slice(0, 3),
    disagreements: byDisagree.filter((r) => Math.abs(r.diff) >= 1).slice(0, 3),
    favorites: shared.filter((r) => r.mine >= 8.5 && r.theirs >= 8.5),
  };
}

export const typeIconFor = (type) => TYPE_ICON[type] || TYPE_ICON.outro;

// ─── "API" ──────────────────────────────────────────────────────────────────

let takeSeq = 100;

export const socialApi = {
  getSummary() {
    const following = users.filter((u) => u.following);
    const followers = users.filter((u) => u.followsYou);
    const visible = feed.filter((a) =>
      a.actorId === 'me' || following.some((u) => u.id === a.actorId),
    );
    return wait({
      following: following.length,
      followers: followers.length,
      recentActivity: visible.length,
      comparable: following.length,
    });
  },

  getFeed() {
    const following = new Set(users.filter((u) => u.following).map((u) => u.id));
    const items = feed
      .filter((a) => a.actorId === 'me' || following.has(a.actorId))
      .map((a) => ({
        ...a,
        actor:
          a.actorId === 'me'
            ? { id: 'me', username: 'Você', handle: 'voce', initials: 'EU', color: 'var(--mr-gold)' }
            : userRef(users.find((u) => u.id === a.actorId)),
      }))
      .sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));
    return wait(items);
  },

  getFollowing() {
    return wait(users.filter((u) => u.following).map(userRef));
  },

  getSuggestions() {
    return wait(users.filter((u) => !u.following).map(userRef));
  },

  searchUsers(q) {
    const s = (q || '').trim().toLowerCase();
    if (!s) return wait([]);
    return wait(
      users
        .filter(
          (u) =>
            u.username.toLowerCase().includes(s) || u.handle.toLowerCase().includes(s),
        )
        .map(userRef),
    );
  },

  getProfile(userId) {
    const u = users.find((x) => x.id === userId);
    if (!u) return Promise.reject(new Error('Usuário não encontrado.'));
    return wait({
      ...userRef(u),
      badges: u.badges,
      top: u.top,
      breakdown: u.breakdown,
      works: u.works,
    });
  },

  toggleFollow(userId) {
    users = users.map((u) =>
      u.id === userId ? { ...u, following: !u.following } : u,
    );
    return wait(userRef(users.find((u) => u.id === userId)));
  },

  /** targetType: 'activity' — reage a um card do feed (inclui takes). */
  react(targetId, kind) {
    if (!REACT_KINDS.includes(kind)) return Promise.reject(new Error('kind inválido'));
    feed = feed.map((a) => {
      if (a.id !== targetId) return a;
      const r = { ...a.reactions };
      if (r.mine === kind) {
        r[kind] = Math.max(0, r[kind] - 1);
        r.mine = null;
      } else {
        if (r.mine) r[r.mine] = Math.max(0, r[r.mine] - 1);
        r[kind] += 1;
        r.mine = kind;
      }
      return { ...a, reactions: r };
    });
    return wait(feed.find((a) => a.id === targetId).reactions, 0);
  },

  /** work: { title, type, score? } — cria um TAKE e joga no topo do feed. */
  postTake({ work, text }) {
    const activity = {
      id: `t${takeSeq++}`,
      type: 'TAKE',
      actorId: 'me',
      createdAt: new Date().toISOString(),
      work,
      text: text.trim(),
      reactions: seedReactions(),
    };
    feed = [activity, ...feed];
    return wait({
      ...activity,
      actor: { id: 'me', username: 'Você', handle: 'voce', initials: 'EU', color: 'var(--mr-gold)' },
    }, 0);
  },
};
