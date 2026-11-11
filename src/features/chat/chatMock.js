/**
 * Dados de teste do chat (só no `npm run dev`, com "Dados de teste" ligado).
 * Mesmas funções do chatService, com as respostas no formato dos DTOs do back
 * (ChatConversationDTO, ChatMessageDTO…). Tudo fica na memória: mandar, editar,
 * apagar e reagir funcionam até recarregar a página. As pessoas são as mesmas
 * do socialMock (marina, lucas…), então abrir o perfil delas também funciona.
 */
import { getMe } from '../../services/userService';

const wait = (ms = 200) => new Promise((r) => setTimeout(r, ms));
// LocalDateTime do back: sem fuso, no horário local
const at = (minutesAgo) => {
  const d = new Date(Date.now() - minutesAgo * 60000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const PEOPLE = {
  9001: { id: 9001, username: 'marina', avatarUrl: null },
  9002: { id: 9002, username: 'lucas', avatarUrl: null },
  9004: { id: 9004, username: 'julia', avatarUrl: null },
  9006: { id: 9006, username: 'rafa', avatarUrl: null },
  9007: { id: 9007, username: 'beto', avatarUrl: null },
};

let state = null;
let nextId = 50000;

async function me() {
  try {
    const u = await getMe();
    return { id: u.id, username: u.username, avatarUrl: u.avatarUrl || null };
  } catch {
    return { id: 1, username: 'você', avatarUrl: null };
  }
}

// [quem (id ou 'me' ou 'sys'), texto, há quantos minutos]
const SCRIPTS = {
  8001: [
    [9001, 'viu o episódio novo de One Piece?', 600],
    ['me', 'vi! que luta', 590],
    [9001, 'dei 10 de novo kkk', 585],
    ['me', 'justo', 580],
    [9001, 'e Breaking Bad, terminou?', 40],
    [9001, 'quero saber tua nota', 39],
  ],
  8002: [
    ['me', 'teu 5,1 pro Breaking Bad é crime', 1500],
    [9007, 'é superestimada, aguenta', 1490],
    ['me', 'vou te mandar a comparação', 1480],
    [9007, 'manda, vou rir', 1470],
  ],
  8003: [
    [9002, 'recomenda um filme pro fim de semana?', 4400],
    ['me', 'Interestelar, se ainda não viu', 4300],
  ],
  7003: [
    ['sys', 'marina criou o grupo', 20000],
    [9001, 'livro de novembro: O Senhor dos Anéis', 3000],
    [9004, 'bora, já comecei', 2900],
    ['me', 'tô no capítulo 3', 200],
    [9006, 'spoiler free por favor', 15],
    [9004, 'ninguém conta nada', 12],
    [9001, 'combinado 👍', 10],
  ],
};

async function world() {
  if (state) return state;
  const self = await me();
  const msg = (convId, [who, body, ago]) => {
    const sender = who === 'me' ? self : who === 'sys' ? null : PEOPLE[who];
    return {
      id: nextId++,
      conversationId: convId,
      senderId: sender?.id ?? null,
      senderName: sender?.username ?? null,
      senderAvatarUrl: sender?.avatarUrl ?? null,
      mine: who === 'me',
      kind: who === 'sys' ? 'SYSTEM' : 'USER',
      body,
      edited: false,
      deleted: false,
      replyTo: null,
      reactions: [],
      createdAt: at(ago),
    };
  };
  const messages = {};
  Object.entries(SCRIPTS).forEach(([id, lines]) => { messages[id] = lines.map((l) => msg(Number(id), l)); });
  messages[7003][4].reactions = [{ emoji: '👍', count: 2, mine: false }];

  const direct = (id, peerId, unread) => ({
    id, type: 'DIRECT', name: null, description: null, imageUrl: null, access: null,
    peer: PEOPLE[peerId], memberCount: 2, myRole: 'MEMBER', pendingRequests: 0, unread,
    peerLastSeenAt: at(peerId === 9001 ? 2 : 300),
  });
  state = {
    self,
    messages,
    convs: [
      direct(8001, 9001, 2),
      direct(8002, 9007, 0),
      direct(8003, 9002, 0),
      {
        id: 7003, type: 'GROUP', name: 'Leitura lenta', description: 'Um livro por mês, sem pressa.', imageUrl: null,
        access: 'OPEN', peer: null, memberCount: 12, myRole: 'MEMBER', pendingRequests: 0, unread: 3,
      },
    ],
    // se seguem e ainda não conversaram: o "diga oi"
    suggested: [PEOPLE[9004], PEOPLE[9006]],
  };
  return state;
}

// a conversa como o back manda: com a última mensagem e os cursores de leitura
function asConv(s, c) {
  const list = s.messages[c.id] || [];
  const last = list[list.length - 1];
  const lastRead = list.length - 1 - c.unread;
  return {
    ...c,
    lastMessage: last ? (last.deleted ? null : last.body) : null,
    lastSenderName: last?.senderName ?? null,
    lastMine: !!last?.mine,
    lastKind: last?.kind ?? null,
    lastAt: last?.createdAt ?? null,
    myLastReadId: lastRead >= 0 ? list[lastRead].id : 0,
    peerLastReadId: c.type === 'DIRECT' && last ? last.id : null,
  };
}

const byLast = (a, b) => String(b.lastAt || '').localeCompare(String(a.lastAt || ''));
const find = (s, messageId) => {
  for (const list of Object.values(s.messages)) {
    const m = list.find((x) => x.id === Number(messageId));
    if (m) return m;
  }
  throw new Error('mensagem não existe');
};
const MEMBERS_7003 = [9001, 9004, 9006, 9002];

export const chatMock = {
  async getConversations() {
    const s = await world();
    await wait();
    return s.convs.map((c) => asConv(s, c)).sort(byLast);
  },
  async startDirect(userId) {
    const s = await world();
    await wait();
    let c = s.convs.find((x) => x.type === 'DIRECT' && x.peer?.id === Number(userId));
    if (!c) {
      c = {
        id: nextId++, type: 'DIRECT', name: null, description: null, imageUrl: null, access: null,
        peer: PEOPLE[userId] || { id: Number(userId), username: `pessoa${userId}`, avatarUrl: null },
        memberCount: 2, myRole: 'MEMBER', pendingRequests: 0, unread: 0, peerLastSeenAt: at(60),
      };
      s.convs.push(c);
      s.messages[c.id] = [];
      s.suggested = s.suggested.filter((u) => u.id !== Number(userId));
    }
    return asConv(s, c);
  },
  async getSuggestedDirects() { const s = await world(); await wait(); return [...s.suggested]; },
  async createGroup({ name, description = '', access = 'CLOSED', imageUrl = '' }) {
    const s = await world();
    await wait();
    const c = {
      id: nextId++, type: 'GROUP', name, description, imageUrl: imageUrl || null, access,
      peer: null, memberCount: 1, myRole: 'OWNER', pendingRequests: 0, unread: 0,
    };
    s.convs.push(c);
    s.messages[c.id] = [{
      id: nextId++, conversationId: c.id, senderId: null, senderName: null, senderAvatarUrl: null, mine: false,
      kind: 'SYSTEM', body: `${s.self.username} criou o grupo`, edited: false, deleted: false, replyTo: null, reactions: [], createdAt: at(0),
    }];
    return asConv(s, c);
  },
  async updateGroup(convId, patch) {
    const s = await world();
    const c = s.convs.find((x) => x.id === Number(convId));
    Object.assign(c, patch);
    return asConv(s, c);
  },
  async deleteConversation(convId) {
    const s = await world();
    s.convs = s.convs.filter((x) => x.id !== Number(convId));
  },
  async getDirectory() { await wait(); return []; },
  async joinGroup() { return 'REQUESTED'; },
  async cancelJoinRequest() {},
  async getInviteToken() { return null; },
  async rotateInviteToken() { return 'teste'; },
  async revokeInviteToken() {},
  async acceptInvite() { throw new Error('sem convites nos dados de teste'); },
  async getJoinRequests() { return []; },
  async approveJoinRequest() {},
  async rejectJoinRequest() {},

  async getMessages(convId, page = 0, size = 50) {
    const s = await world();
    await wait();
    const list = s.messages[convId] || [];
    const end = Math.max(0, list.length - page * size);
    return list.slice(Math.max(0, end - size), end);
  },
  async sendMessage(convId, body, replyToId = null) {
    const s = await world();
    const reply = replyToId ? find(s, replyToId) : null;
    const m = {
      id: nextId++, conversationId: Number(convId), senderId: s.self.id, senderName: s.self.username,
      senderAvatarUrl: s.self.avatarUrl, mine: true, kind: 'USER', body, edited: false, deleted: false,
      replyTo: reply ? { id: reply.id, senderName: reply.senderName, excerpt: reply.body?.slice(0, 80), deleted: reply.deleted } : null,
      reactions: [], createdAt: at(0),
    };
    (s.messages[convId] ||= []).push(m);
    return { ...m };
  },
  async editMessage(messageId, body) {
    const m = find(await world(), messageId);
    Object.assign(m, { body, edited: true });
    return { ...m };
  },
  async deleteMessage(messageId) {
    const m = find(await world(), messageId);
    Object.assign(m, { body: null, deleted: true, reactions: [] });
    return { ...m };
  },
  async reactMessage(messageId, emoji) {
    const m = find(await world(), messageId);
    const prev = m.reactions.find((r) => r.mine);
    m.reactions = m.reactions
      .map((r) => (r.mine ? { ...r, count: r.count - 1, mine: false } : r))
      .filter((r) => r.count > 0);
    if (prev?.emoji !== emoji) {
      const r = m.reactions.find((x) => x.emoji === emoji);
      if (r) Object.assign(r, { count: r.count + 1, mine: true });
      else m.reactions.push({ emoji, count: 1, mine: true });
    }
    return { ...m };
  },
  async markConversationRead(convId) {
    const s = await world();
    const c = s.convs.find((x) => x.id === Number(convId));
    if (c) c.unread = 0;
  },
  async sendTyping() {},

  async getMembers(convId) {
    const s = await world();
    await wait();
    const c = s.convs.find((x) => x.id === Number(convId));
    const ids = c?.type === 'GROUP' ? MEMBERS_7003 : [c?.peer?.id];
    return [
      { userId: s.self.id, username: s.self.username, avatarUrl: s.self.avatarUrl, role: c?.myRole || 'MEMBER' },
      ...ids.filter(Boolean).map((id, i) => ({
        userId: id, username: PEOPLE[id]?.username, avatarUrl: null, role: i === 0 && c?.type === 'GROUP' ? 'OWNER' : 'MEMBER',
      })),
    ];
  },
  async addMembers(convId) { return this.getMembers(convId); },
  async removeMember() {},
  async setMemberRole(convId) { return this.getMembers(convId); },
  async getChatUnreadCount() {
    const s = await world();
    return s.convs.reduce((n, c) => n + (c.unread || 0), 0);
  },
};
