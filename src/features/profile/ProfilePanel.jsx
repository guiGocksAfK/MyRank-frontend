import React, { useState, useEffect, useRef } from 'react';
import { mediaItems, badges } from '../../data/mockData';
import { getMe, updateMe, uploadAvatar, deleteAvatar } from '../../services/userService';
import Avatar from '../../shared/components/Avatar';
import { useUser } from '../../shared/userContext';

const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const AVATAR_MAX_BYTES = 1_000_000;

// ─── helpers ───────────────────────────────────────────────────────────────
const typeIcons = {
  filme:  '🎬',
  jogo:   '🎮',
  serie:  '📺',
  livro:  '📚',
  anime:  '🎌',
  outro:  '📦',
};

function formatTime(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) return '0h';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Componente: linha de configuração ────────────────────────────────────
function SettingRow({ label, desc, children }) {
  return (
    <div className="mr-setting-row">
      <div>
        <div className="mr-setting-label">{label}</div>
        {desc && <div className="mr-setting-desc">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── Componente: Badge card ───────────────────────────────────────────────
function BadgeCard({ badge }) {
  const pct = Math.min(
    Math.round((badge.progress / badge.maxProgress) * 100),
    100
  );

  return (
    <div className={`mr-badge-card ${badge.unlocked ? 'unlocked' : 'locked'}`}>
      <span className="mr-badge-icon">{badge.icon}</span>

      <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: 4 }}>
        {badge.name}
      </div>
      <div style={{
        fontSize: '0.6875rem',
        color: 'var(--mr-text-secondary)',
        marginBottom: 10,
        lineHeight: 1.35,
      }}>
        {badge.description}
      </div>

      {badge.unlocked ? (
        <div className="mr-flex mr-items-center mr-justify-center mr-gap-2">
          <div className="mr-dot-green" />
          <span style={{ fontSize: '0.75rem', color: 'var(--mr-green)', fontWeight: 500 }}>
            Desbloqueado
          </span>
        </div>
      ) : (
        <div>
          <div className="mr-flex mr-justify-between mr-mb-1" style={{ fontSize: '0.6875rem' }}>
            <span style={{ color: 'var(--mr-text-secondary)' }}>
              {badge.progress}/{badge.maxProgress}
            </span>
            <span style={{ color: 'var(--mr-text-secondary)' }}>{pct}%</span>
          </div>
          <div className="mr-progress mr-progress-sm">
            <div
              className="mr-progress-bar"
              style={{
                width: `${pct}%`,
                backgroundColor: 'var(--mr-gold)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────
export default function ProfilePanel({ isDark, onThemeToggle }) {
  const [profileUsername, setProfileUsername] = useState('usuario');
  const [profileBio,      setProfileBio]      = useState('Apaixonado por jogos, filmes e livros. Avaliador e colecionador de favoritos.');
  const [profilePlan,     setProfilePlan]     = useState('FREE');
  const [createdAt,       setCreatedAt]       = useState(null);
  const [loadingProfile,  setLoadingProfile]  = useState(true);
  const [editMode,        setEditMode]        = useState(false);
  const [draftUsername,   setDraftUsername]   = useState(profileUsername);
  const [draftBio,        setDraftBio]        = useState(profileBio);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState('');
  const [badgeFilter,     setBadgeFilter]     = useState('all'); // 'all' | 'unlocked' | 'locked'
  const [profile,         setProfile]         = useState(null);  // objeto /users/me completo (id, avatarUrl, updatedAt...)
  const [avatarVersion,   setAvatarVersion]   = useState(0);     // muda pra furar o cache do <img> após upload
  const [avatarBusy,      setAvatarBusy]      = useState(false);
  const [avatarError,     setAvatarError]     = useState('');
  const fileInputRef = useRef(null);
  const { setUser } = useUser();

  // atualiza o form local + o usuário compartilhado (header, saudação da home)
  const applyUser = (u) => {
    setProfile(u);
    setUser(u);
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await getMe();
        applyUser(user);
        setProfileUsername(user.username || 'usuario');
        setProfileBio(user.bio || 'Apaixonado por jogos, filmes e livros. Avaliador e colecionador de favoritos.');
        setProfilePlan(user.plan || 'FREE');
        setCreatedAt(user.createdAt || null);
      } catch (err) {
        setError('Não foi possível carregar seu perfil.');
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, []);

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Formato inválido. Use PNG, JPEG ou WebP.');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError('Imagem muito grande. O limite é 1 MB.');
      return;
    }
    setAvatarError('');
    setAvatarBusy(true);
    try {
      await uploadAvatar(file);
      applyUser(await getMe());
      setAvatarVersion((v) => v + 1);
    } catch (err) {
      setAvatarError(err.response?.data?.message || 'Erro ao enviar a foto.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarError('');
    setAvatarBusy(true);
    try {
      await deleteAvatar();
      applyUser(await getMe());
      setAvatarVersion((v) => v + 1);
    } catch (err) {
      setAvatarError('Erro ao remover a foto.');
    } finally {
      setAvatarBusy(false);
    }
  };

  useEffect(() => {
    setDraftUsername(profileUsername);
    setDraftBio(profileBio);
  }, [profileUsername, profileBio]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateMe({
        username: draftUsername.trim() || profileUsername,
        bio: draftBio.trim() || profileBio,
      });

      applyUser(updated);
      setProfileUsername(updated.username || profileUsername);
      setProfileBio(updated.bio || profileBio);
      setEditMode(false);
    } catch (err) {
      const message = err.response?.data?.message || 'Erro ao salvar perfil.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // ── Stats derivados dos dados ──
  const totalMinutes  = mediaItems.reduce((s, item) => s + (item.timeMinutes ?? 0), 0);
  const totalHours    = Math.round(totalMinutes / 60);
  const avgNote       = (
    mediaItems.reduce((s, item) => s + item.finalNote, 0) / mediaItems.length
  ).toFixed(1);
  const unlockedCount = badges.filter(b => b.unlocked).length;
  const bestItem      = mediaItems.reduce((best, item) => (!best || item.finalNote > best.finalNote ? item : best), null);
  const longestItem   = mediaItems.reduce((top, item) => (!top || (item.timeMinutes ?? 0) > (top.timeMinutes ?? 0) ? item : top), null);
  const typeCounts    = mediaItems.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});
  const activities = [
    { text: `Avaliou ${bestItem?.title ?? 'uma obra'} com ${bestItem?.finalNote?.toFixed(1) ?? '—'}`, time: '2h atrás' },
    { text: `Adicionou ${mediaItems[0]?.title ?? 'uma obra'} ao ranking`, time: '1 dia atrás' },
    { text: `Destravou badge ${badges.find(b => b.unlocked)?.name ?? 'Novo badge'}`, time: '3 dias atrás' },
  ];

  // Filtro de badges
  const visibleBadges =
    badgeFilter === 'unlocked' ? badges.filter(b =>  b.unlocked) :
    badgeFilter === 'locked'   ? badges.filter(b => !b.unlocked) :
    badges;

  if (loadingProfile) {
    return (
      <div className="mr-card">
        <div className="mr-card-body">Carregando perfil...</div>
      </div>
    );
  }

  return (
    <div className="mr-space-y-6">

      {/* ── Header ── */}
      <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-4">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>⚙️ Perfil</h1>
          <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            Configurações, conquistas e dados da sua conta
          </p>
        </div>
      </div>

      {/* ── Layout principal: avatar + settings ── */}
      <div className="mr-profile-grid">

        {/* ── Coluna esquerda: card do perfil ── */}
        <div className="mr-card">
          <div className="mr-card-body mr-text-center mr-space-y-4">

            {/* Avatar */}
            <div className="mr-flex mr-justify-center" style={{ flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <Avatar
                user={profile || { username: profileUsername }}
                cacheKey={avatarVersion}
                className="mr-avatar-lg"
              />

              {editMode && (
                <div className="mr-flex mr-gap-2 mr-items-center" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAvatarPick}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="mr-btn mr-btn-sm mr-btn-outline"
                    disabled={avatarBusy}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {avatarBusy ? 'Enviando…' : 'Trocar foto'}
                  </button>
                  <button
                    type="button"
                    className="mr-btn mr-btn-sm mr-btn-outline"
                    disabled={avatarBusy}
                    onClick={handleAvatarRemove}
                  >
                    Remover
                  </button>
                </div>
              )}

              {avatarError && <p className="auth-error" style={{ margin: 0 }}>{avatarError}</p>}
            </div>

            <div style={{ textAlign: 'left', width: '100%' }}>
              {editMode ? (
                <div className="mr-space-y-3">
                  <div>
                    <label className="mr-setting-label" style={{ marginBottom: 6 }}>Usuário</label>
                    <input
                      className="mr-input"
                      value={draftUsername}
                      onChange={e => setDraftUsername(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label className="mr-setting-label" style={{ marginBottom: 6 }}>Bio</label>
                    <textarea
                      className="mr-input"
                      value={draftBio}
                      onChange={e => setDraftBio(e.target.value)}
                      rows={3}
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>
                  {error && <p className="auth-error">{error}</p>}
                  <div className="mr-flex mr-gap-2 mr-justify-center" style={{ marginTop: 6 }}>
                    <button className="mr-btn mr-btn-outline mr-btn-sm" onClick={() => {
                      setEditMode(false);
                      setDraftUsername(profileUsername);
                      setDraftBio(profileBio);
                      setError('');
                    }}>
                      Cancelar
                    </button>
                    <button className="mr-btn mr-btn-gold mr-btn-sm" onClick={handleSave} disabled={saving}>
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>@{profileUsername}</div>
                  {createdAt && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--mr-text-secondary)', marginTop: 6 }}>
                      Membro desde {formatDate(createdAt)}
                    </div>
                  )}
                  {profilePlan && (
                    <div style={{ marginTop: 8 }}>
                      <span className={`mr-badge ${profilePlan === 'PRO' ? 'mr-badge-gold' : 'mr-badge-outline'}`}>
                        {profilePlan === 'PRO' ? 'PRO' : 'FREE'}
                      </span>
                    </div>
                  )}
                  <button
                    className="mr-btn mr-btn-sm mr-btn-outline"
                    style={{ marginTop: 12 }}
                    onClick={() => setEditMode(true)}
                  >
                    Editar perfil
                  </button>
                </>
              )}
            </div>

            {/* Mini stats inline */}
            <div className="mr-grid-3col" style={{ textAlign: 'center' }}>
              {[
                { label: 'Obras',      value: mediaItems.length },
                { label: 'Horas',      value: `${totalHours}h`  },
                { label: 'Média',      value: avgNote            },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--mr-gold)' }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--mr-text-secondary)' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Bio e conquistas rápidas */}
            <div style={{ borderTop: '1px solid var(--mr-border)', paddingTop: 16, textAlign: 'left' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--mr-text)', marginBottom: 10 }}>
                {profileBio}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', marginBottom: 12 }}>
                Conquistas rápidas
              </div>
              <div className="mr-flex mr-flex-wrap mr-justify-center mr-gap-2">
                {badges.slice(0, 5).map(badge => (
                  <span
                    key={badge.id}
                    title={badge.name}
                    style={{
                      fontSize: '1.4rem',
                      opacity: badge.unlocked ? 1 : 0.22,
                      filter: badge.unlocked ? 'none' : 'grayscale(100%)',
                      cursor: 'default',
                      lineHeight: 1,
                    }}
                  >
                    {badge.icon}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)', marginTop: 10 }}>
                {unlockedCount} de {badges.length} desbloqueados
              </div>
            </div>

          </div>
        </div>

        {/* ── Coluna direita: configurações ── */}
        <div className="mr-space-y-6">

          {/* Aparência (RF-012) */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <h3 style={{ fontWeight: 700 }}>🎨 Aparência</h3>
              <SettingRow
                label="Modo escuro"
                desc="Alternar entre tema claro e escuro"
              >
                <button
                  className={`mr-switch ${isDark ? 'checked' : ''}`}
                  onClick={onThemeToggle}
                >
                  <span className="mr-switch-thumb" />
                </button>
              </SettingRow>
            </div>
          </div>

          {/* Histórico de atividade */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <div className="mr-flex mr-items-center mr-justify-between">
                <h3 style={{ fontWeight: 700 }}>🕒 Histórico</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)' }}>
                  Últimas ações
                </span>
              </div>

              <div className="mr-space-y-3">
                {activities.map((activity, idx) => (
                  <div key={idx} style={{ borderRadius: 8, padding: '10px 12px', background: 'var(--mr-surface)', border: '1px solid var(--mr-border)' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{activity.text}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', marginTop: 4 }}>{activity.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* APIs Conectadas */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <div className="mr-flex mr-items-center mr-justify-between">
                <h3 style={{ fontWeight: 700 }}>🔌 APIs Conectadas</h3>
              </div>

              {/* Tabela de APIs — mesmo padrão das outras tabelas */}
              <div
                className="mr-table-header"
                style={{ gridTemplateColumns: '28px 1fr 1fr 90px' }}
              >
                <span />
                <span>Serviço</span>
                <span>Cobertura</span>
                <span style={{ textAlign: 'right' }}>Status</span>
              </div>

              {[
                { icon: '🎬', name: 'TMDB',          desc: 'Filmes e Séries',  status: 'Conectado', ok: true  },
                { icon: '🎮', name: 'RAWG',           desc: 'Jogos',            status: 'Conectado', ok: true  },
                { icon: '📚', name: 'Open Library',   desc: 'Livros',           status: 'Conectado', ok: true  },
                { icon: '🤖', name: 'Claude AI',      desc: 'Insights e Análises', status: 'Ativo', ok: true   },
              ].map((api, i) => (
                <div
                  key={i}
                  className="mr-table-row"
                  style={{ gridTemplateColumns: '28px 1fr 1fr 90px' }}
                >
                  <span style={{ fontSize: '1rem' }}>{api.icon}</span>

                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {api.name}
                  </span>

                  <span style={{ fontSize: '0.8125rem', color: 'var(--mr-text-secondary)' }}>
                    {api.desc}
                  </span>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      className={`mr-badge ${api.ok ? 'mr-badge-green' : 'mr-badge-outline'}`}
                      style={{ fontSize: '0.7rem' }}
                    >
                      {api.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Badges e Conquistas (RF-012) — largura total ── */}
      <div>
        <div className="mr-flex mr-items-center mr-gap-2 mr-flex-wrap" style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem' }}>🏅 Badges e Conquistas</h2>
          <span style={{ fontSize: '0.8125rem', color: 'var(--mr-text-muted)', marginRight: 'auto' }}>
            RF-012
          </span>

          {/* Filtro de badges — mesmo padrão toolbar */}
          <div className="mr-flex mr-gap-1">
            {[
              { id: 'all',      label: 'Todos'          },
              { id: 'unlocked', label: '✓ Desbloqueados' },
              { id: 'locked',   label: '🔒 Bloqueados'   },
            ].map(f => (
              <button
                key={f.id}
                className={`mr-btn mr-btn-sm ${badgeFilter === f.id ? 'mr-btn-gold' : 'mr-btn-outline'}`}
                onClick={() => setBadgeFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--mr-text-muted)' }}>
            {visibleBadges.length} de {badges.length}
          </div>
        </div>

        {visibleBadges.length === 0 ? (
          <div className="mr-card">
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
              Nenhum badge encontrado para este filtro. 🔍
            </div>
          </div>
        ) : (
          <div className="mr-badge-grid">
            {visibleBadges.map(badge => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}