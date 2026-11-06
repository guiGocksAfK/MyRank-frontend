/**
 * Dados FALSOS da aba Social, só pra desenvolvimento.
 *
 * Como o site ainda não tem outros usuários, a Social aparece quase toda vazia.
 * Com o interruptor "Dados de teste" ligado (só existe no `npm run dev`), o
 * `socialApi` responde daqui em vez do backend: umas pessoas inventadas, takes,
 * avaliações e grupos. As obras e capas são as SUAS (de /works/unified), com
 * notas diferentes, pra ficar com cara de verdade.
 *
 * Nada aqui vai pro backend e nada disso entra no build de produção (o
 * socialData só importa este arquivo quando import.meta.env.DEV).
 * Tudo vive na memória: recarregou a página, volta ao começo.
 */
import { getUnifiedWorks } from '../../services/WorkService';
import { templateType } from '../../shared/tableTemplates';
import { decorateUser, decorateFeedItem, decorateComment } from './socialData';

const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const hoursAgo = (h) => new Date(Date.now() - h * 3600_000).toISOString();

// pessoas inventadas
const PEOPLE = [
  { id: 9001, username: 'marina', bio: 'Jogo de tudo, termino quase nada.', worksCount: 84, avgScore: 7.9, isPublic: true },
  { id: 9002, username: 'lucas', bio: 'Cinéfilo de fim de semana.', worksCount: 41, avgScore: 8.2, isPublic: true },
  { id: 9003, username: 'pedro', bio: '', worksCount: 23, avgScore: 7.1, isPublic: true },
  { id: 9004, username: 'julia', bio: 'Anime > tudo', worksCount: 132, avgScore: 8.6, isPublic: true },
  { id: 9005, username: 'ana', bio: 'Leio mais do que devia.', worksCount: 57, avgScore: 8.0, isPublic: false },
  { id: 9006, username: 'rafa', bio: 'Dou 10 fácil.', worksCount: 19, avgScore: 9.1, isPublic: true },
];

const TAKES = [
  'Lindo, mas arrastado demais no meio. Quase larguei.',
  'Revi ontem e continua impecável. Não tem uma cena sobrando.',
  'Todo mundo fala bem, mas o final me deixou frio.',
  'Subestimado demais. Merecia mais gente falando disso.',
];

const COMMENTS = [
  'Discordo total, o ritmo é o charme.',
  'Finalmente alguém falou isso.',
  'Vou dar mais uma chance então.',
];

let state = null;

/** Monta o mundo falso uma vez, a partir das suas obras. */
async function world() {
  if (state) return state;
  let works = [];
  try { works = await getUnifiedWorks(); } catch { /* sem obras: usa títulos genéricos */ }
  const pool = (Array.isArray(works) ? works : []).slice(0, 12).map((w) => ({
    id: w.id, title: w.title, type: templateType(w.template), imageUrl: w.imageUrl || null,
    score: Number(w.score) || 8,
  }));
  if (pool.length === 0) {
    ['Interestelar', 'Red Dead Redemption 2', 'One Piece', 'Duna'].forEach((title, i) => pool.push({
      id: -1 - i, title, type: ['filme', 'jogo', 'anime', 'livro'][i], imageUrl: null, score: 8.5,
    }));
  }
  const pick = (i) => pool[i % pool.length];
  // a nota de cada pessoa varia em volta da sua
  const theirScore = (w, k) => Math.max(1, Math.min(10, Math.round((w.score + [-1.4, 0.6, -0.3, 1.1, -2.2][k % 5]) * 10) / 10));

  const users = new Map(PEOPLE.map((p) => [p.id, {
    ...p, avatarUrl: null, plan: 'FREE',
    following: [9001, 9002, 9006].includes(p.id),
    followsYou: [9001, 9002, 9005].includes(p.id),
    requested: false,
  }]));

  let nextId = 1;
  const reactions = (up, agree, disagree, mine = null) => ({ up, agree, disagree, mine });
  const feed = [
    { type: 'TAKE', actor: 9001, h: 2, w: pick(0), k: 0, text: TAKES[0], comments: 2, r: reactions(4, 18, 31) },
    { type: 'RATED', actor: 9002, h: 5, w: pick(1), k: 1, r: reactions(6, 0, 0) },
    { type: 'BADGE', actor: 9006, h: 9, badge: { code: 'first_ten', name: 'Primeiro 10' }, r: reactions(3, 0, 0) },
    { type: 'TAKE', actor: 9002, h: 20, w: pick(2), k: 2, text: TAKES[1], comments: 1, r: reactions(9, 5, 1, 'agree') },
    { type: 'MOVED_TOP', actor: 9001, h: 30, w: pick(3), k: 3, r: reactions(2, 0, 0) },
    { type: 'ADDED', actor: 9006, h: 52, w: pick(4), k: 4, r: reactions(0, 0, 0) },
    { type: 'TAKE', actor: 9006, h: 70, w: pick(5), k: 0, text: TAKES[3], comments: 0, r: reactions(1, 2, 0) },
  ].map((e) => {
    const id = nextId++;
    const work = e.w ? { ...e.w, score: theirScore(e.w, e.k) } : null;
    return {
      id, type: e.type, createdAt: hoursAgo(e.h), actor: users.get(e.actor), work, badge: e.badge || null,
      takeText: e.text ?? null, takeId: e.type === 'TAKE' ? 500 + id : null, commentCount: e.comments ?? 0,
      takeEdited: false, canManage: false, reactions: e.r,
    };
  });

  const comments = new Map();
  feed.filter((f) => f.takeId).forEach((f, i) => {
    comments.set(f.takeId, Array.from({ length: f.commentCount }, (_, j) => ({
      id: f.takeId * 10 + j, parentId: null, author: users.get(PEOPLE[(i + j + 1) % PEOPLE.length].id),
      text: COMMENTS[(i + j) % COMMENTS.length], createdAt: hoursAgo(1 + j), edited: false, canEdit: false, canDelete: false, replies: [],
    })));
  });

  const groups = [
    { id: 7001, name: 'Clube do terror', description: 'Um filme de terror por semana.', imageUrl: null, access: 'OPEN', memberCount: 23, membership: 'NONE' },
    { id: 7002, name: 'Só RPG', description: 'JRPG, CRPG e o que mais tiver ficha.', imageUrl: null, access: 'REQUEST', memberCount: 58, membership: 'NONE' },
    { id: 7003, name: 'Leitura lenta', description: 'Um livro por mês, sem pressa.', imageUrl: null, access: 'OPEN', memberCount: 12, membership: 'NONE' },
  ];

  state = { users, feed, comments, groups, pool, requests: [9005], nextId, theirScore };
  return state;
}

const asUser = (u) => decorateUser(u);
const followingList = (s) => [...s.users.values()].filter((u) => u.following);
const followerList = (s) => [...s.users.values()].filter((u) => u.followsYou);

export const mockApi = {
  async getSummary() {
    const s = await world();
    await wait();
    return { following: followingList(s).length, followers: followerList(s).length, recentActivity: s.feed.length };
  },
  async getFeed() {
    const s = await world();
    await wait();
    return s.feed.map(decorateFeedItem);
  },
  async getFollowing() { const s = await world(); await wait(); return followingList(s).map(asUser); },
  async getFollowers() { const s = await world(); await wait(); return followerList(s).map(asUser); },
  async getRecentFollowers(limit = 5) { const s = await world(); await wait(); return followerList(s).slice(0, limit).map(asUser); },
  async getSuggestions() {
    const s = await world();
    await wait();
    return [...s.users.values()].filter((u) => !u.following && !s.requests.includes(u.id)).map(asUser);
  },
  async searchUsers(q) {
    const s = await world();
    await wait(150);
    const term = (q || '').trim().replace(/^@+/, '').toLowerCase();
    if (!term) return [];
    return [...s.users.values()].filter((u) => u.username.includes(term)).map(asUser);
  },
  async getProfile(userId) {
    const s = await world();
    await wait();
    const u = s.users.get(Number(userId));
    if (!u) throw new Error('not found');
    const works = s.pool.map((w, k) => ({ ...w, score: s.theirScore(w, k + Number(userId)) }));
    const locked = !u.isPublic && !u.following;
    const breakdown = {};
    works.forEach((w) => { breakdown[w.type] = (breakdown[w.type] || 0) + 1; });
    return {
      ...asUser(u), locked,
      followerCount: 10 + (u.id % 7) * 3, followingCount: 6 + (u.id % 5) * 2,
      badges: locked ? [] : [{ code: 'first_ten', name: 'Primeiro 10', icon: '' }],
      top: locked ? [] : [...works].sort((a, b) => b.score - a.score).slice(0, 10),
      breakdown: locked ? {} : breakdown,
      works: locked ? [] : works,
    };
  },
  async toggleFollow(userId) {
    const s = await world();
    await wait(200);
    const u = s.users.get(Number(userId));
    if (u.following || u.requested) { u.following = false; u.requested = false; } else if (u.isPublic) u.following = true; else u.requested = true;
    return asUser(u);
  },
  async getFollowRequests() { const s = await world(); await wait(); return s.requests.map((id) => asUser(s.users.get(id))); },
  async approveFollowRequest(id) { const s = await world(); s.requests = s.requests.filter((r) => r !== Number(id)); s.users.get(Number(id)).followsYou = true; },
  async rejectFollowRequest(id) { const s = await world(); s.requests = s.requests.filter((r) => r !== Number(id)); },
  async react(feedEventId, kind) {
    const s = await world();
    await wait(150);
    const item = s.feed.find((f) => f.id === feedEventId);
    const r = { ...item.reactions };
    if (r.mine === kind) { r[kind] = Math.max(0, r[kind] - 1); r.mine = null; } else {
      if (r.mine) r[r.mine] = Math.max(0, r[r.mine] - 1);
      r[kind] += 1; r.mine = kind;
    }
    item.reactions = r;
    return r;
  },
  async postTake({ workId, text }) {
    const s = await world();
    await wait();
    const w = s.pool.find((p) => p.id === workId) || s.pool[0];
    const id = s.nextId++;
    const me = { id: 0, username: localStorage.getItem('myrank_username') || 'você', avatarUrl: null };
    const item = {
      id, type: 'TAKE', createdAt: new Date().toISOString(), actor: me, work: w, badge: null, takeText: text,
      takeId: 500 + id, commentCount: 0, takeEdited: false, canManage: true, reactions: { up: 0, agree: 0, disagree: 0, mine: null },
    };
    s.feed.unshift(item);
    s.comments.set(item.takeId, []);
    return decorateFeedItem(item);
  },
  async editTake(takeId, text) {
    const s = await world();
    const item = s.feed.find((f) => f.takeId === takeId);
    item.takeText = text; item.takeEdited = true;
    return decorateFeedItem(item);
  },
  async deleteTake(takeId) { const s = await world(); s.feed = s.feed.filter((f) => f.takeId !== takeId); },
  async getTakeComments(takeId) { const s = await world(); await wait(); return (s.comments.get(takeId) || []).map(decorateComment); },
  async addTakeComment(takeId, text, parentCommentId = null) {
    const s = await world();
    const me = { id: 0, username: localStorage.getItem('myrank_username') || 'você', avatarUrl: null };
    const c = { id: Date.now(), parentId: parentCommentId, author: me, text, createdAt: new Date().toISOString(), edited: false, canEdit: true, canDelete: true, replies: [] };
    const list = s.comments.get(takeId) || [];
    if (parentCommentId) list.find((x) => x.id === parentCommentId)?.replies.push(c); else list.push(c);
    s.comments.set(takeId, list);
    return decorateComment(c);
  },
  async editTakeComment(commentId, text) { return decorateComment({ id: commentId, text, author: { id: 0, username: 'você' }, edited: true, canEdit: true, canDelete: true }); },
  async deleteTakeComment() {},
  async getGroups(q = '') {
    const s = await world();
    await wait();
    const term = q.trim().toLowerCase();
    return s.groups.filter((g) => !term || g.name.toLowerCase().includes(term));
  },
  async joinGroup(convId) {
    const s = await world();
    const g = s.groups.find((x) => x.id === convId);
    g.membership = g.access === 'OPEN' ? 'MEMBER' : 'PENDING';
    return g.access === 'OPEN' ? 'JOINED' : 'REQUESTED';
  },
  async cancelJoinRequest(convId) { const s = await world(); s.groups.find((x) => x.id === convId).membership = 'NONE'; },
};
