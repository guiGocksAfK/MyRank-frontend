/**
 * Camada de dados da aba Social.
 *
 * `socialApi.*` fala com o backend (/api/social/**) e adapta os DTOs pro
 * shape que os componentes esperam (handle/initials derivados, etc.).
 * As assinaturas são as mesmas do mock antigo — os componentes não mudaram.
 *
 * Só no dev: com "Dados de teste" ligado, as chamadas vão pro socialMock.js
 * (pessoas e takes inventados), pra dar pra ver e testar a Social cheia.
 */
import { createElement } from 'react';
import api from '../../services/api';
import { getDirectory, joinGroup, cancelJoinRequest, getConversations } from '../../services/chatService';
import { TABLE_TEMPLATES, TEMPLATE_ICONS } from '../../shared/tableTemplates';

// tipo de mídia (filme, jogo...) → o mesmo ícone de traço dos templates
const TYPE_ICON = Object.fromEntries(
  Object.entries(TABLE_TEMPLATES).map(([template, { type }]) => [type, TEMPLATE_ICONS[template]]),
);

/** Ícone de traço do tipo da obra (no lugar do emoji antigo). */
export const typeIconFor = (type, size = 14) => createElement(TYPE_ICON[type] || TEMPLATE_ICONS.custom, {
  size, strokeWidth: 1.8, 'aria-hidden': true, className: 'social-type-icon',
});

// ─── derivações visuais ─────────────────────────────────────────────────────

function initialsFor(username) {
  return (username || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function avatarSrc(user) {
  return user?.avatarUrl || null;
}

/** SocialUserDTO / ActorDTO / SocialProfileDTO → shape dos componentes. */
export function decorateUser(u) {
  if (!u) return null;
  return {
    ...u,
    handle: u.username,
    initials: initialsFor(u.username),
    avatarSrc: avatarSrc(u),
    stats: {
      works: u.worksCount ?? u.stats?.works ?? 0,
      avgScore: u.avgScore ?? u.stats?.avgScore ?? 0,
    },
    // gosto parecido (calculado no backend): obras em comum e a %, que só vem com 3+
    sharedCount: u.sharedCount ?? 0,
    matchPct: u.matchPct ?? null,
    // a obra em que vocês mais discordam ("brigam em…")
    fight: u.fightTitle ? { title: u.fightTitle, mine: u.fightMine, theirs: u.fightTheirs } : null,
  };
}

/** FeedItemDTO → item que o ActivityCard consome. */
export function decorateFeedItem(it) {
  return {
    id: it.id,
    type: it.type,
    createdAt: it.createdAt,
    actor: decorateUser(it.actor),
    work: it.work
      ? { ...it.work, score: it.work.score ?? it.score ?? null }
      : it.score != null
        ? { score: it.score }
        : null,
    text: it.takeText ?? null,
    takeId: it.takeId ?? null,
    commentCount: it.commentCount ?? 0,
    takeEdited: !!it.takeEdited,
    canManage: !!it.canManage,
    reactions: it.reactions || { up: 0, agree: 0, disagree: 0, mine: null },
    // RATED_DAY: as obras avaliadas no dia (até 8) e o total
    works: it.works || [],
    workCount: it.workCount ?? 0,
  };
}

/** TakeCommentDTO → nó de comentário (com respostas). */
export function decorateComment(c) {
  return {
    id: c.id,
    parentId: c.parentId ?? null,
    author: decorateUser(c.author),
    text: c.text,
    createdAt: c.createdAt,
    edited: !!c.edited,
    canEdit: !!c.canEdit,
    canDelete: !!c.canDelete,
    replies: (c.replies || []).map(decorateComment),
  };
}

const normTitle = (t) => (t || '').trim().toLowerCase();

/** Obra em comum = mesmo título e mesmo tipo ("Duna" filme e livro são obras diferentes). */
export const tasteKey = (title, type) => `${normTitle(title)}|${type || ''}`;

// Mesma conta da TasteMatch no backend (as listas usam a de lá, o perfil e o
// Comparar esta): as duas têm que dar o mesmo número.
export const MATCH_MIN_SHARED = 5;
/** Até essa % a pessoa é "pra debater" (mesmo corte do backend), não "parecida". */
export const DEBATE_MAX_PCT = 60;
/** Pode aparecer em "mais parecidos": tem % acima do corte, ou ainda não tem % (poucas obras). */
export const looksLikeMe = (u) => u.matchPct == null || u.matchPct > DEBATE_MAX_PCT;
const MATCH_SHRINK = 5;
const MATCH_RELATIVE_WEIGHT = 0.6;

/**
 * Gosto parecido entre "minhas obras" e as de outra pessoa.
 * - Duas medidas de 0 a 100 (100 − 12 × diferença média): a nota em si e o gosto
 *   relativo (o quanto cada um gostou acima ou abaixo da própria média). A
 *   relativa pesa mais: quem dá 9 pra tudo não combina com todo mundo.
 * - Com poucas obras em comum a % é puxada pros 50%; só existe com 5 ou mais.
 */
export function computeTasteMatch(myItems = [], theirWorks = []) {
  const mineRated = myItems.filter((i) => i.title && Number.isFinite(Number(i.note)) && Number(i.note) > 0);
  const theirsRated = theirWorks.filter((w) => w.title && w.score != null && Number.isFinite(Number(w.score)));
  const avg = (list, f) => (list.length ? list.reduce((s, x) => s + f(x), 0) / list.length : 0);
  const myAvg = avg(mineRated, (i) => Number(i.note));
  const theirAvg = avg(theirsRated, (w) => Number(w.score));

  const mine = new Map();
  mineRated.forEach((i) => { const k = tasteKey(i.title, i.type); if (!mine.has(k)) mine.set(k, Number(i.note)); });
  const seen = new Set();
  const shared = [];
  theirsRated.forEach((w) => {
    const k = tasteKey(w.title, w.type);
    const myScore = mine.get(k);
    if (myScore == null || seen.has(k)) return;
    seen.add(k);
    const theirs = Number(w.score);
    shared.push({
      title: w.title,
      type: w.type,
      mine: myScore,
      theirs,
      diff: +(myScore - theirs).toFixed(1),
      rel: Math.abs((myScore - myAvg) - (theirs - theirAvg)),
    });
  });

  if (shared.length === 0) {
    return { sharedCount: 0, matchPct: null, agreements: [], disagreements: [], favorites: [] };
  }

  let matchPct = null;
  if (shared.length >= MATCH_MIN_SHARED) {
    const raw = 100 - 12 * avg(shared, (r) => Math.abs(r.mine - r.theirs));
    const rel = 100 - 12 * avg(shared, (r) => r.rel);
    const combined = MATCH_RELATIVE_WEIGHT * rel + (1 - MATCH_RELATIVE_WEIGHT) * raw;
    const shrunk = (shared.length * combined + MATCH_SHRINK * 50) / (shared.length + MATCH_SHRINK);
    matchPct = Math.round(Math.max(0, Math.min(100, shrunk)));
  }
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

// ─── API ────────────────────────────────────────────────────────────────────

const realApi = {
  async getSummary() {
    const { data } = await api.get('/social/summary');
    return {
      following: data.following,
      followers: data.followers,
      recentActivity: data.feedCount,
    };
  },

  /** `scope`: 'all' (quem você segue + perfis públicos) ou 'following' (só quem você segue). */
  async getFeed(page = 0, size = 20, scope = 'all') {
    const { data } = await api.get('/social/feed', { params: { page, size, scope } });
    return (Array.isArray(data) ? data : []).map(decorateFeedItem);
  },

  async getFollowing() {
    const { data } = await api.get('/social/following');
    return (data || []).map(decorateUser);
  },

  async getFollowers() {
    const { data } = await api.get('/social/followers');
    return (data || []).map(decorateUser);
  },

  async getRecentFollowers(limit = 5) {
    const { data } = await api.get('/social/followers/recent', { params: { limit } });
    return (data || []).map(decorateUser);
  },

  async getSuggestions() {
    const { data } = await api.get('/social/suggestions');
    return (data || []).map(decorateUser);
  },

  /** Quem tem o gosto mais diferente do seu (8+ obras em comum), com a obra da briga. */
  async getDebaters() {
    const { data } = await api.get('/social/debaters');
    return (data || []).map(decorateUser);
  },

  async searchUsers(q) {
    // aceita "@handle" ou "handle" — o backend casa só com o username
    const query = (q || '').trim().replace(/^@+/, '');
    if (!query) return [];
    const { data } = await api.get('/social/users', { params: { q: query } });
    return (data || []).map(decorateUser);
  },

  async getProfile(userId) {
    const { data } = await api.get(`/social/users/${userId}`);
    return {
      ...decorateUser(data),
      badges: data.badges || [],
      top: data.top || [],
      breakdown: data.breakdown || {},
      works: data.works || [],
    };
  },

  async toggleFollow(userId) {
    const { data } = await api.post(`/social/follow/${userId}`);
    return decorateUser(data);
  },

  async getFollowRequests() {
    const { data } = await api.get('/social/follow-requests');
    return (data || []).map(decorateUser);
  },

  async approveFollowRequest(requesterId) {
    await api.post(`/social/follow-requests/${requesterId}/approve`);
  },

  async rejectFollowRequest(requesterId) {
    await api.post(`/social/follow-requests/${requesterId}/reject`);
  },

  async react(feedEventId, kind) {
    const { data } = await api.post(`/social/feed/${feedEventId}/react`, { kind });
    return data; // { up, agree, disagree, mine }
  },

  async postTake({ workId, text }) {
    const { data } = await api.post('/social/takes', { workId, text });
    return decorateFeedItem(data);
  },

  async editTake(takeId, text) {
    const { data } = await api.patch(`/social/takes/${takeId}`, { text });
    return decorateFeedItem(data);
  },

  async deleteTake(takeId) {
    await api.delete(`/social/takes/${takeId}`);
  },

  async getTakeComments(takeId) {
    const { data } = await api.get(`/social/takes/${takeId}/comments`);
    return (data || []).map(decorateComment);
  },

  async addTakeComment(takeId, text, parentCommentId = null) {
    const { data } = await api.post(`/social/takes/${takeId}/comments`, { text, parentCommentId });
    return decorateComment(data);
  },

  async editTakeComment(commentId, text) {
    const { data } = await api.patch(`/social/comments/${commentId}`, { text });
    return decorateComment(data);
  },

  async deleteTakeComment(commentId) {
    await api.delete(`/social/comments/${commentId}`);
  },

  // grupos (moram no chat, mas a Social lista e entra por aqui)
  getGroups: (q = '', page = 0) => getDirectory(q, page),
  /** Os grupos em que você está (as conversas de grupo), pro atalho da coluna da esquerda. */
  async getMyGroups() {
    return (await getConversations()).filter((c) => c.type === 'GROUP');
  },
  joinGroup: (convId) => joinGroup(convId),
  cancelJoinRequest: (convId) => cancelJoinRequest(convId),
};

// ─── dados de teste (só no dev) ─────────────────────────────────────────────

const MOCK_KEY = 'myrank_social_mock';

/** Interruptor "Dados de teste": só existe no `npm run dev`. */
export const socialMock = {
  available: import.meta.env.DEV,
  isOn() {
    if (!import.meta.env.DEV) return false;
    try { return localStorage.getItem(MOCK_KEY) === '1'; } catch { return false; }
  },
  set(on) {
    try {
      if (on) localStorage.setItem(MOCK_KEY, '1'); else localStorage.removeItem(MOCK_KEY);
    } catch { /* sem localStorage: fica desligado */ }
  },
};

// ─── última resposta guardada ───────────────────────────────────────────────
// A Social é desmontada ao trocar de aba. Sem isto, cada volta mostrava
// "carregando" de novo; com isto a tela abre com o que já tinha e se atualiza
// quando a resposta nova chega. Fica só na memória: some no F5.

const REMEMBERED = new Set([
  'getSummary', 'getFeed', 'getSuggestions', 'getDebaters', 'getFollowRequests',
  'getMyGroups', 'getFollowing', 'getGroups',
]);
const lastAnswers = new Map();
const inFlight = new Map(); // buscas que ainda não responderam, pra não repetir a mesma
let lastOwner = null;

// de quem são as respostas guardadas: trocou de conta (ou ligou os dados de teste), zera
function ownerKey() {
  try { return `${localStorage.getItem('myrank_username') || ''}|${socialMock.isOn()}`; } catch { return ''; }
}
function answers() {
  const owner = ownerKey();
  if (owner !== lastOwner) {
    lastAnswers.clear();
    lastOwner = owner;
  }
  return lastAnswers;
}
const answerKey = (name, args) => `${name}:${JSON.stringify(args)}`;

/** Última resposta de `socialApi[name](...args)`, se já houve uma; senão `undefined`. */
export function lastSocial(name, ...args) {
  return answers().get(answerKey(name, args));
}

async function call(name, args) {
  if (import.meta.env.DEV && socialMock.isOn()) {
    const { mockApi } = await import('./socialMock');
    return mockApi[name](...args);
  }
  return realApi[name](...args);
}

/**
 * Mesmas funções do realApi. No dev com o interruptor ligado, responde o
 * socialMock.js; no build de produção esse caminho nem existe.
 */
export const socialApi = Object.fromEntries(Object.keys(realApi).map((name) => [
  name,
  (...args) => {
    // qualquer ação que muda algo (seguir, postar...) invalida as buscas em andamento
    if (!REMEMBERED.has(name)) {
      inFlight.clear();
      return call(name, args);
    }
    // duas telas pedindo a mesma coisa ao mesmo tempo (o cartão "Você" aparece
    // em dois lugares) dividem uma chamada só
    const owner = ownerKey();
    const key = `${owner}|${answerKey(name, args)}`;
    const running = inFlight.get(key);
    if (running) return running;
    const request = call(name, args)
      .then((result) => {
        // só guarda se a conta ainda é a mesma de quando a chamada saiu
        if (owner === ownerKey()) answers().set(answerKey(name, args), result);
        return result;
      })
      .finally(() => { if (inFlight.get(key) === request) inFlight.delete(key); });
    inFlight.set(key, request);
    return request;
  },
]));
