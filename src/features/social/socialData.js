/**
 * Camada de dados da aba Social.
 *
 * `socialApi.*` fala com o backend (/api/social/**) e adapta os DTOs pro
 * shape que os componentes esperam (handle/initials/color derivados, etc.).
 * As assinaturas são as mesmas do mock antigo — os componentes não mudaram.
 */
import api from '../../services/api';

const TYPE_ICON = {
  jogo: '🎮',
  filme: '🎬',
  serie: '📺',
  livro: '📚',
  anime: '🌸',
  outro: '📦',
};
export const typeIconFor = (type) => TYPE_ICON[type] || TYPE_ICON.outro;

// ─── derivações visuais ─────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#3b5bdb', '#0ca678', '#e67700', '#9c36b5', '#1c7ed6',
  '#e64980', '#2f9e44', '#f08c00', '#7048e8', '#0c8599',
];

function colorFor(id) {
  const n = Math.abs(Number(id) || 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

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
function decorateUser(u) {
  if (!u) return null;
  return {
    ...u,
    handle: u.username,
    initials: initialsFor(u.username),
    color: colorFor(u.id),
    avatarSrc: avatarSrc(u),
    stats: {
      works: u.worksCount ?? u.stats?.works ?? 0,
      avgScore: u.avgScore ?? u.stats?.avgScore ?? 0,
    },
  };
}

/** FeedItemDTO → item que o ActivityCard consome. */
function decorateFeedItem(it) {
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
    badge: it.badge ? { icon: it.badge.icon, name: it.badge.name } : null,
    text: it.takeText ?? null,
    reactions: it.reactions || { up: 0, agree: 0, disagree: 0, mine: null },
  };
}

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
        theirs: Number(w.score),
        diff: +(myScore - Number(w.score)).toFixed(1),
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

// ─── API ────────────────────────────────────────────────────────────────────

export const socialApi = {
  async getSummary() {
    const { data } = await api.get('/social/summary');
    return {
      following: data.following,
      followers: data.followers,
      recentActivity: data.feedCount,
    };
  },

  async getFeed(page = 0, size = 20) {
    const { data } = await api.get('/social/feed', { params: { page, size } });
    return (Array.isArray(data) ? data : []).map(decorateFeedItem);
  },

  async getFollowing() {
    const { data } = await api.get('/social/following');
    return (data || []).map(decorateUser);
  },

  async getSuggestions() {
    const { data } = await api.get('/social/suggestions');
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

  async react(feedEventId, kind) {
    const { data } = await api.post(`/social/feed/${feedEventId}/react`, { kind });
    return data; // { up, agree, disagree, mine }
  },

  async postTake({ workId, text }) {
    const { data } = await api.post('/social/takes', { workId, text });
    return decorateFeedItem(data);
  },
};
