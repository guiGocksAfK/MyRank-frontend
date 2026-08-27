import React, { useState, useMemo } from 'react';
import './social.css';

// ─── Mock data ─────────────────────────────────────────────────────────────
const MOCK_FRIENDS = [
  {
    id: 'js', name: 'João Silva', handle: '@joaosilva',
    initials: 'JS', avatarColor: '#3b5bdb',
    obras: 87, avgNote: 7.8, following: true,
    rankings: [
      { title: 'Interstellar',         note: 9.5, category: '🎬 Filmes' },
      { title: 'The Witcher 3',        note: 9.8, category: '🎮 Jogos'  },
      { title: 'Breaking Bad',         note: 9.2, category: '📺 Séries' },
      { title: 'Dune',                 note: 8.7, category: '🎬 Filmes' },
      { title: 'Elden Ring',           note: 9.0, category: '🎮 Jogos'  },
    ],
  },
  {
    id: 'mo', name: 'Maria Oliveira', handle: '@mariaoliveira',
    initials: 'MO', avatarColor: '#0ca678',
    obras: 124, avgNote: 8.2, following: true,
    rankings: [
      { title: 'Duna: Parte Dois',     note: 9.3, category: '🎬 Filmes' },
      { title: 'Breaking Bad',         note: 10.0, category: '📺 Séries' },
      { title: 'Interstellar',         note: 8.9, category: '🎬 Filmes' },
      { title: 'The Last of Us',       note: 9.6, category: '📺 Séries' },
      { title: 'Elden Ring',           note: 8.4, category: '🎮 Jogos'  },
    ],
  },
  {
    id: 'cs', name: 'Carlos Santos', handle: '@carlossantos',
    initials: 'CS', avatarColor: '#e67700',
    obras: 56, avgNote: 6.9, following: true,
    rankings: [
      { title: 'The Witcher 3',        note: 9.5, category: '🎮 Jogos'  },
      { title: 'Interstellar',         note: 7.2, category: '🎬 Filmes' },
      { title: 'Breaking Bad',         note: 8.1, category: '📺 Séries' },
      { title: 'Dune',                 note: 6.9, category: '🎬 Filmes' },
      { title: 'Elden Ring',           note: 9.1, category: '🎮 Jogos'  },
    ],
  },
  {
    id: 'ac', name: 'Ana Costa', handle: '@anacosta',
    initials: 'AC', avatarColor: '#9c36b5',
    obras: 203, avgNote: 8.5, following: false,
    rankings: [
      { title: 'Interstellar',         note: 9.8, category: '🎬 Filmes' },
      { title: 'Breaking Bad',         note: 9.5, category: '📺 Séries' },
      { title: 'Dune',                 note: 9.1, category: '🎬 Filmes' },
      { title: 'The Witcher 3',        note: 8.7, category: '🎮 Jogos'  },
      { title: 'Elden Ring',           note: 8.2, category: '🎮 Jogos'  },
    ],
  },
  {
    id: 'pl', name: 'Pedro Lima', handle: '@pedrolima',
    initials: 'PL', avatarColor: '#1971c2',
    obras: 45, avgNote: 7.2, following: true,
    rankings: [
      { title: 'Breaking Bad',         note: 9.9, category: '📺 Séries' },
      { title: 'Interstellar',         note: 8.0, category: '🎬 Filmes' },
      { title: 'The Witcher 3',        note: 7.5, category: '🎮 Jogos'  },
      { title: 'Dune',                 note: 7.8, category: '🎬 Filmes' },
      { title: 'Elden Ring',           note: 6.5, category: '🎮 Jogos'  },
    ],
  },
];

// Notas do usuário logado (LS)
const MY_RANKINGS = [
  { title: 'Interstellar',   note: 9.2, category: '🎬 Filmes' },
  { title: 'The Witcher 3',  note: 9.8, category: '🎮 Jogos'  },
  { title: 'Breaking Bad',   note: 9.5, category: '📺 Séries' },
  { title: 'Dune',           note: 8.5, category: '🎬 Filmes' },
  { title: 'Elden Ring',     note: 8.8, category: '🎮 Jogos'  },
];

const MOCK_FEED = [
  { id: 1, friendId: 'js', action: 'avaliou',    target: 'Interstellar',              detail: 'nota 9.5',          time: '2min atrás',   icon: '⭐' },
  { id: 2, friendId: 'mo', action: 'adicionou',  target: 'Duna: Parte Dois',          detail: 'ao ranking',        time: '14min atrás',  icon: '➕' },
  { id: 3, friendId: 'cs', action: 'criou',      target: 'ranking de jogos',          detail: '5 obras',           time: '1h atrás',     icon: '🏆' },
  { id: 4, friendId: 'pl', action: 'comparou',   target: 'ranking com João Silva',    detail: '',                  time: '2h atrás',     icon: '⚖️' },
  { id: 5, friendId: 'mo', action: 'avaliou',    target: 'The Last of Us',            detail: 'nota 9.6',          time: '3h atrás',     icon: '⭐' },
  { id: 6, friendId: 'js', action: 'adicionou',  target: 'Elden Ring',                detail: 'ao ranking',        time: '5h atrás',     icon: '➕' },
  { id: 7, friendId: 'ac', action: 'avaliou',    target: 'Dune',                      detail: 'nota 9.1',          time: '7h atrás',     icon: '⭐' },
  { id: 8, friendId: 'cs', action: 'avaliou',    target: 'Breaking Bad',              detail: 'nota 8.1',          time: '1d atrás',     icon: '⭐' },
];

// ─── helpers ───────────────────────────────────────────────────────────────
function Avatar({ initials, color, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '33', border: `1px solid ${color}55`,
      color, fontWeight: 700,
      fontSize: size <= 36 ? '0.75rem' : '0.875rem',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function NoteDiff({ mine, theirs }) {
  if (mine == null || theirs == null) return <span style={{ color: 'var(--mr-text-muted)', fontSize: '0.8rem' }}>—</span>;
  const diff = +(mine - theirs).toFixed(1);
  const color = diff > 0 ? 'var(--mr-gold)' : diff < 0 ? '#e24b4a' : 'var(--mr-text-secondary)';
  const sign  = diff > 0 ? '+' : '';
  return (
    <span style={{ fontWeight: 700, color, fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
      {diff === 0 ? '=' : `${sign}${diff}`}
    </span>
  );
}

function NoteBar({ note, max = 10 }) {
  const pct = Math.min((note / max) * 100, 100);
  const cls  = note >= 8 ? 'green' : note >= 6 ? 'yellow' : 'red';
  return (
    <div className="mr-note-bar" style={{ flex: 1 }}>
      <div className={`mr-note-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── View: Comparar rankings ──────────────────────────────────────────────
function CompareView({ friend, onClose }) {
  const allTitles = useMemo(() => {
    const set = new Set([
      ...MY_RANKINGS.map(x => x.title),
      ...friend.rankings.map(x => x.title),
    ]);
    return [...set];
  }, [friend]);

  const rows = useMemo(() =>
    allTitles.map(title => {
      const mine   = MY_RANKINGS.find(x => x.title === title);
      const theirs = friend.rankings.find(x => x.title === title);
      return { title, mine, theirs };
    }).sort((a, b) => {
      // Obras em comum primeiro
      const aShared = a.mine && a.theirs ? 1 : 0;
      const bShared = b.mine && b.theirs ? 1 : 0;
      return bShared - aShared || (b.mine?.note ?? 0) - (a.mine?.note ?? 0);
    }),
  [allTitles, friend]);

  const sharedCount = rows.filter(r => r.mine && r.theirs).length;
  const myAvg   = +(MY_RANKINGS.reduce((s, x) => s + x.note, 0) / MY_RANKINGS.length).toFixed(1);
  const theirAvg = +(friend.rankings.reduce((s, x) => s + x.note, 0) / friend.rankings.length).toFixed(1);
  const agreement = sharedCount > 0
    ? +(100 - sharedCount * 10 * Math.abs(
        rows.filter(r => r.mine && r.theirs)
            .reduce((s, r) => s + Math.abs(r.mine.note - r.theirs.note), 0) /
        (sharedCount * 10)
      )).toFixed(0)
    : 0;

  return (
    <div className="mr-space-y-6 social-panel">

      {/* Header */}
      <div className="mr-flex mr-items-center mr-gap-3 mr-flex-wrap">
        <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={onClose}>← Voltar</button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>⚖️ Comparar Rankings</h1>
          <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            Você vs. {friend.name}
          </p>
        </div>
      </div>

      {/* Stat cards de comparação */}
      <div className="mr-stats-grid">
        <div className="mr-stat-card">
          <div className="mr-stat-icon-row"><span className="mr-stat-icon">🤝</span><span className="mr-stat-dot" /></div>
          <div className="mr-stat-value">{sharedCount}</div>
          <div className="mr-stat-label">Obras em comum</div>
        </div>
        <div className="mr-stat-card">
          <div className="mr-stat-icon-row"><span className="mr-stat-icon">🎯</span><span className="mr-stat-dot" /></div>
          <div className="mr-stat-value">{agreement}%</div>
          <div className="mr-stat-label">Afinidade de gosto</div>
        </div>
        <div className="mr-stat-card">
          <div className="mr-stat-icon-row"><span className="mr-stat-icon">⭐</span><span className="mr-stat-dot" /></div>
          <div className="mr-stat-value">{myAvg}</div>
          <div className="mr-stat-label">Sua média geral</div>
        </div>
        <div className="mr-stat-card">
          <div className="mr-stat-icon-row">
            <Avatar initials={friend.initials} color={friend.avatarColor} size={28} />
            <span className="mr-stat-dot" />
          </div>
          <div className="mr-stat-value">{theirAvg}</div>
          <div className="mr-stat-label">Média de {friend.name.split(' ')[0]}</div>
        </div>
      </div>

      {/* Tabela de comparação */}
      <div className="mr-card">
        <div className="mr-card-body mr-space-y-2">

          {/* Cabeçalho da tabela */}
          <div className="mr-table-header" style={{ gridTemplateColumns: '1fr 110px 110px 60px' }}>
            <span>Obra</span>
            <span style={{ textAlign: 'right' }}>Você</span>
            <span style={{ textAlign: 'right' }}>{friend.name.split(' ')[0]}</span>
            <span style={{ textAlign: 'center' }}>Diff</span>
          </div>

          {rows.map((row, i) => {
            const isShared = row.mine && row.theirs;
            return (
              <div
                key={row.title}
                className="mr-table-row"
                style={{
                  gridTemplateColumns: '1fr 110px 110px 60px',
                  borderLeft: isShared && i < 3 ? '3px solid var(--mr-gold)' : undefined,
                  opacity: isShared ? 1 : 0.55,
                }}
              >
                <div className="mr-min-w-0">
                  <div className="mr-truncate" style={{ fontWeight: 500 }}>{row.title}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-muted)', marginTop: 1 }}>
                    {row.mine?.category ?? row.theirs?.category}
                    {!isShared && (
                      <span style={{ marginLeft: 6, color: 'var(--mr-text-muted)', fontStyle: 'italic' }}>
                        {row.mine ? '(só você)' : `(só ${friend.name.split(' ')[0]})`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Nota — Você */}
                <div className="mr-flex mr-items-center mr-gap-2" style={{ justifyContent: 'flex-end' }}>
                  {row.mine ? (
                    <>
                      <NoteBar note={row.mine.note} />
                      <span style={{ fontWeight: 700, color: 'var(--mr-gold)', minWidth: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {row.mine.note.toFixed(1)}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--mr-text-muted)', fontSize: '0.8rem', minWidth: 32 }}>—</span>
                  )}
                </div>

                {/* Nota — Amigo */}
                <div className="mr-flex mr-items-center mr-gap-2" style={{ justifyContent: 'flex-end' }}>
                  {row.theirs ? (
                    <>
                      <NoteBar note={row.theirs.note} />
                      <span style={{ fontWeight: 700, color: friend.avatarColor, minWidth: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {row.theirs.note.toFixed(1)}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--mr-text-muted)', fontSize: '0.8rem', minWidth: 32 }}>—</span>
                  )}
                </div>

                {/* Diff */}
                <div style={{ textAlign: 'center' }}>
                  <NoteDiff mine={row.mine?.note} theirs={row.theirs?.note} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function SocialPanel() {
  const [friends,       setFriends]       = useState(MOCK_FRIENDS);
  const [activeTab,     setActiveTab]     = useState('feed');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [publicProfile, setPublicProfile] = useState(true);
  const [comparingWith, setComparingWith] = useState(null);

  // Se estiver comparando, mostra a view de comparação
  if (comparingWith) {
    return <CompareView friend={comparingWith} onClose={() => setComparingWith(null)} />;
  }

  const followingList = friends.filter(f => f.following);
  const suggestions   = friends.filter(f => !f.following);

  const filteredFriends = searchQuery.trim()
    ? friends.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.handle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : friends;

  function toggleFollow(id) {
    setFriends(prev => prev.map(f => f.id === id ? { ...f, following: !f.following } : f));
  }

  const feedItems = MOCK_FEED.filter(item =>
    followingList.some(f => f.id === item.friendId)
  );

  return (
    <div className="mr-space-y-6">

      {/* ── Header ── */}
      <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-4">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>👥 Social</h1>
          <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            Acompanhe amigos e compare seus rankings
          </p>
        </div>

        {/* Toggle perfil público */}
        <div className="mr-flex mr-items-center mr-gap-3">
          <span style={{ fontSize: '0.875rem', color: 'var(--mr-text-secondary)' }}>
            Perfil {publicProfile ? 'público' : 'privado'}
          </span>
          <button
            className={`mr-switch ${publicProfile ? 'checked' : ''}`}
            onClick={() => setPublicProfile(v => !v)}
          >
            <span className="mr-switch-thumb" />
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="mr-stats-grid">
        <div className="mr-stat-card">
          <div className="mr-stat-icon-row"><span className="mr-stat-icon">👥</span><span className="mr-stat-dot" /></div>
          <div className="mr-stat-value">{followingList.length}</div>
          <div className="mr-stat-label">Seguindo</div>
        </div>
        <div className="mr-stat-card">
          <div className="mr-stat-icon-row"><span className="mr-stat-icon">📡</span><span className="mr-stat-dot" /></div>
          <div className="mr-stat-value">{feedItems.length}</div>
          <div className="mr-stat-label">Atividades recentes</div>
        </div>
        <div className="mr-stat-card">
          <div className="mr-stat-icon-row"><span className="mr-stat-icon">⚖️</span><span className="mr-stat-dot" /></div>
          <div className="mr-stat-value">{followingList.length}</div>
          <div className="mr-stat-label">Rankings p/ comparar</div>
        </div>
        <div className="mr-stat-card">
          <div className="mr-stat-icon-row"><span className="mr-stat-icon">{publicProfile ? '🌐' : '🔒'}</span><span className="mr-stat-dot" /></div>
          <div className="mr-stat-value">{publicProfile ? 'Público' : 'Privado'}</div>
          <div className="mr-stat-label">Visibilidade do perfil</div>
        </div>
      </div>

      {/* ── Tabs internas ── */}
      <div
        className="mr-flex mr-items-center mr-gap-1 social-tabs"
      >
        {[
          { id: 'feed',    label: '📡 Feed' },
          { id: 'amigos',  label: '👥 Amigos' },
          { id: 'buscar',  label: '🔍 Buscar' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`mr-tab-trigger social-tab-trigger ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════
          TAB: FEED
      ════════════════════════════════════════════ */}
      {activeTab === 'feed' && (
        <div className="mr-card">
          <div className="mr-card-body mr-space-y-2">

            {/* Cabeçalho da tabela */}
            <div
              className="mr-table-header"
              style={{ gridTemplateColumns: '40px 1fr 90px' }}
            >
              <span />
              <span>Atividade</span>
              <span style={{ textAlign: 'right' }}>Quando</span>
            </div>

            {feedItems.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '2.5rem 1rem',
                color: 'var(--mr-text-secondary)', fontSize: '0.875rem',
              }}>
                Nenhuma atividade recente. Siga mais amigos para ver o feed! 👀
              </div>
            )}

            {feedItems.map((item, i) => {
              const friend = friends.find(f => f.id === item.friendId);
              if (!friend) return null;
              return (
                <div
                  key={item.id}
                  className="mr-table-row"
                  style={{
                    gridTemplateColumns: '40px 1fr 90px',
                    borderLeft: i < 3 ? '3px solid var(--mr-gold)' : undefined,
                  }}
                >
                  <Avatar initials={friend.initials} color={friend.avatarColor} size={32} />

                  <div className="mr-min-w-0">
                    <div style={{ fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 700 }}>{friend.name}</span>
                      <span style={{ color: 'var(--mr-text-secondary)', marginLeft: 6 }}>
                        {item.action}
                      </span>
                      <span style={{ fontWeight: 600, marginLeft: 6 }}>{item.target}</span>
                      {item.detail && (
                        <span style={{ color: 'var(--mr-text-muted)', marginLeft: 6, fontSize: '0.8rem' }}>
                          — {item.detail}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-muted)', marginTop: 2 }}>
                      {friend.handle}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--mr-text-muted)', whiteSpace: 'nowrap' }}>
                    {item.time}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          TAB: AMIGOS
      ════════════════════════════════════════════ */}
      {activeTab === 'amigos' && (
        <div className="mr-space-y-4">

          {/* Seguindo */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-2">
              <div
                className="mr-table-header"
                style={{ gridTemplateColumns: '40px 1fr 80px 80px 120px' }}
              >
                <span />
                <span>Amigo</span>
                <span style={{ textAlign: 'right' }}>Obras</span>
                <span style={{ textAlign: 'right' }}>Média</span>
                <span style={{ textAlign: 'right' }}>Ações</span>
              </div>

              {followingList.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '2.5rem 1rem',
                  color: 'var(--mr-text-secondary)', fontSize: '0.875rem',
                }}>
                  Você ainda não segue ninguém. Vá em Buscar para encontrar amigos! 🔍
                </div>
              )}

              {followingList.map((friend, i) => (
                <div
                  key={friend.id}
                  className="mr-table-row"
                  style={{
                    gridTemplateColumns: '40px 1fr 80px 80px 120px',
                    borderLeft: i < 3 ? '3px solid var(--mr-gold)' : undefined,
                  }}
                >
                  <Avatar initials={friend.initials} color={friend.avatarColor} size={32} />

                  <div className="mr-min-w-0">
                    <div className="mr-truncate" style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                      {friend.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)', marginTop: 1 }}>
                      {friend.handle}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {friend.obras}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginLeft: 4 }}>
                      obras
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: 'var(--mr-gold)', fontVariantNumeric: 'tabular-nums' }}>
                      {friend.avgNote.toFixed(1)}
                    </span>
                  </div>

                  <div className="mr-flex mr-gap-2" style={{ justifyContent: 'flex-end' }}>
                    <button
                      className="mr-btn mr-btn-outline mr-btn-sm"
                      onClick={() => setComparingWith(friend)}
                      title="Comparar rankings"
                    >
                      ⚖️ Comparar
                    </button>
                    <button
                      className="mr-btn mr-btn-outline mr-btn-sm"
                      style={{ color: '#e24b4a', borderColor: 'rgba(226,75,74,0.35)' }}
                      onClick={() => toggleFollow(friend.id)}
                      title="Deixar de seguir"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sugestões */}
          {suggestions.length > 0 && (
            <div className="mr-card">
              <div className="mr-card-body mr-space-y-2">
                <div style={{
                  fontSize: '0.75rem', color: 'var(--mr-text-secondary)',
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 8,
                }}>
                  Sugestões para seguir
                </div>

                {suggestions.map(friend => (
                  <div
                    key={friend.id}
                    className="mr-table-row"
                    style={{ gridTemplateColumns: '40px 1fr 80px 80px 120px' }}
                  >
                    <Avatar initials={friend.initials} color={friend.avatarColor} size={32} />

                    <div className="mr-min-w-0">
                      <div className="mr-truncate" style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                        {friend.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)', marginTop: 1 }}>
                        {friend.handle}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {friend.obras}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginLeft: 4 }}>
                        obras
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: 'var(--mr-gold)', fontVariantNumeric: 'tabular-nums' }}>
                        {friend.avgNote.toFixed(1)}
                      </span>
                    </div>

                    <div className="mr-flex mr-gap-2" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="mr-btn mr-btn-gold mr-btn-sm"
                        onClick={() => toggleFollow(friend.id)}
                      >
                        + Seguir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          TAB: BUSCAR
      ════════════════════════════════════════════ */}
      {activeTab === 'buscar' && (
        <div className="mr-space-y-4">

          {/* Barra de busca — mesmo padrão do FilterPanel */}
          <div className="mr-flex mr-items-center mr-gap-2">
            <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--mr-text-muted)', fontSize: '0.875rem', pointerEvents: 'none',
              }}>
                🔍
              </span>
              <input
                type="text"
                placeholder="Buscar por nome ou @handle..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px 8px 32px',
                  borderRadius: 8, border: '1px solid var(--mr-border)',
                  background: 'var(--mr-surface)', color: 'var(--mr-text)',
                  fontSize: '0.875rem', outline: 'none',
                }}
              />
            </div>
            {searchQuery && (
              <button
                className="mr-btn mr-btn-outline mr-btn-sm"
                onClick={() => setSearchQuery('')}
              >
                Limpar
              </button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--mr-text-muted)' }}>
              {filteredFriends.length} de {friends.length} usuários
            </span>
          </div>

          <div className="mr-card">
            <div className="mr-card-body mr-space-y-2">
              <div
                className="mr-table-header"
                style={{ gridTemplateColumns: '40px 1fr 80px 80px 120px' }}
              >
                <span />
                <span>Usuário</span>
                <span style={{ textAlign: 'right' }}>Obras</span>
                <span style={{ textAlign: 'right' }}>Média</span>
                <span style={{ textAlign: 'right' }}>Ações</span>
              </div>

              {filteredFriends.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '2.5rem 1rem',
                  color: 'var(--mr-text-secondary)', fontSize: '0.875rem',
                }}>
                  Nenhum usuário encontrado para "{searchQuery}". 🔍
                </div>
              )}

              {filteredFriends.map(friend => (
                <div
                  key={friend.id}
                  className="mr-table-row"
                  style={{ gridTemplateColumns: '40px 1fr 80px 80px 120px' }}
                >
                  <Avatar initials={friend.initials} color={friend.avatarColor} size={32} />

                  <div className="mr-min-w-0">
                    <div className="mr-truncate" style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                      {friend.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)', marginTop: 1 }}>
                      {friend.handle}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {friend.obras}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)', marginLeft: 4 }}>
                      obras
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: 'var(--mr-gold)', fontVariantNumeric: 'tabular-nums' }}>
                      {friend.avgNote.toFixed(1)}
                    </span>
                  </div>

                  <div className="mr-flex mr-gap-2" style={{ justifyContent: 'flex-end' }}>
                    {friend.following ? (
                      <>
                        <button
                          className="mr-btn mr-btn-outline mr-btn-sm"
                          onClick={() => setComparingWith(friend)}
                        >
                          ⚖️ Comparar
                        </button>
                        <button
                          className="mr-btn mr-btn-outline mr-btn-sm"
                          style={{
                            color: 'var(--mr-text-secondary)',
                            borderColor: 'var(--mr-border)',
                            fontSize: '0.75rem',
                          }}
                          onClick={() => toggleFollow(friend.id)}
                        >
                          Seguindo
                        </button>
                      </>
                    ) : (
                      <button
                        className="mr-btn mr-btn-gold mr-btn-sm"
                        onClick={() => toggleFollow(friend.id)}
                      >
                        + Seguir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}