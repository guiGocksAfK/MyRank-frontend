import React, { useState, useEffect } from 'react';
import { getMe, updateMe } from '../../services/userService';
import Avatar from '../../shared/components/Avatar';
import AvatarUploadModal from './AvatarUploadModal';
import { useUser } from '../../shared/userContext';
import {
  useUnifiedItems,
  computeStats,
  computeBreakdown,
  computeHighlights,
  relativeTime,
} from '../../shared/useUnifiedItems';
import { useBadges, groupByBucket } from '../../shared/badges';

// ─── helpers ───────────────────────────────────────────────────────────────
const safeStringify = (v) => {
  try { return JSON.stringify(v, null, 2); }
  catch { return String(v); }
};

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

// ─── Componente: linha rótulo → valor (destaques / dados da conta) ─────────
function KVRow({ label, value, meta }) {
  return (
    <div
      className="mr-flex mr-items-center mr-justify-between mr-gap-3"
      style={{ fontSize: '0.85rem' }}
    >
      <span style={{ color: 'var(--mr-text-secondary)', flexShrink: 0 }}>{label}</span>
      <span
        className="mr-flex mr-items-center mr-gap-2"
        style={{ minWidth: 0, justifyContent: 'flex-end', textAlign: 'right' }}
      >
        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value ?? '—'}
        </span>
        {meta ? <strong style={{ color: 'var(--mr-gold)', flexShrink: 0 }}>{meta}</strong> : null}
      </span>
    </div>
  );
}

// ─── Componente: Badge card ───────────────────────────────────────────────
function BadgeCard({ badge }) {
  const pct = Math.min(
    Math.round((badge.progress / Math.max(badge.maxProgress, 1)) * 100),
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
      ) : badge.hasProgress ? (
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
      ) : (
        <div className="mr-flex mr-items-center mr-justify-center mr-gap-2">
          <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)' }}>🔒 Bloqueado</span>
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
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarError,     setAvatarError]     = useState(null); // objeto de detalhe; PERSISTE mesmo após o modal fechar
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

  const handleAvatarDone = (freshUser) => {
    applyUser(freshUser);
    setAvatarVersion((v) => v + 1);
    setAvatarError(null);
    setAvatarModalOpen(false);
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

  // ── Stats reais das obras do usuário (GET /works/unified) ──
  const { items: works, loading: loadingWorks } = useUnifiedItems();
  const stats = computeStats(works || []);
  const breakdown = computeBreakdown(works || []);
  const highlights = computeHighlights(works || []);

  const { badges, loading: loadingBadges } = useBadges();
  const badgeList = badges || [];
  const unlockedCount = badgeList.filter(b => b.unlocked).length;

  const hoursLabel = (min) => `${Math.round((min || 0) / 60)}h`;

  // Histórico = obras mais recentes por data de adição
  const activities = (works || [])
    .filter(w => w.addedDate)
    .slice()
    .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
    .slice(0, 6)
    .map(w => ({
      text: `Adicionou ${w.title}`,
      time: relativeTime(w.addedDate),
    }));

  // Filtro de badges
  const visibleBadges =
    badgeFilter === 'unlocked' ? badgeList.filter(b =>  b.unlocked) :
    badgeFilter === 'locked'   ? badgeList.filter(b => !b.unlocked) :
    badgeList;
  const visibleGroups = groupByBucket(visibleBadges);

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
                <button
                  type="button"
                  className="mr-btn mr-btn-sm mr-btn-outline"
                  onClick={() => setAvatarModalOpen(true)}
                >
                  Trocar foto
                </button>
              )}

              {avatarError && (
                <div
                  style={{
                    width: '100%', textAlign: 'left', marginTop: 4,
                    padding: '0.7rem 0.8rem', borderRadius: 8,
                    background: 'rgba(226,75,74,0.10)', border: '1px solid rgba(226,75,74,0.4)',
                  }}
                >
                  <div className="mr-flex mr-items-center mr-justify-between" style={{ gap: 8, marginBottom: 4 }}>
                    <strong style={{ color: '#ff8d8b', fontSize: '0.8rem' }}>
                      {avatarError.kind === 'http'
                        ? `Falha no upload — HTTP ${avatarError.status} ${avatarError.statusText || ''}`
                        : avatarError.kind === 'no-response'
                          ? 'Falha no upload — servidor não respondeu'
                          : 'Falha no upload — erro no cliente'}
                    </strong>
                    <button
                      type="button"
                      className="mr-btn mr-btn-ghost mr-btn-sm"
                      onClick={() => setAvatarError(null)}
                      style={{ flexShrink: 0 }}
                    >
                      ✕
                    </button>
                  </div>
                  {(avatarError.serverMessage || avatarError.hint || avatarError.message) && (
                    <p style={{ margin: '0 0 6px', fontSize: '0.8rem' }}>
                      {avatarError.serverMessage || avatarError.hint || avatarError.message}
                    </p>
                  )}
                  <details>
                    <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>
                      Ver detalhes técnicos
                    </summary>
                    <pre
                      style={{
                        margin: '6px 0 0', maxHeight: 240, overflow: 'auto',
                        fontSize: '0.7rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        color: 'var(--mr-text-secondary)',
                      }}
                    >
                      {safeStringify(avatarError)}
                    </pre>
                  </details>
                  <button
                    type="button"
                    className="mr-btn mr-btn-outline mr-btn-sm"
                    style={{ marginTop: 6 }}
                    onClick={() => navigator.clipboard?.writeText(safeStringify(avatarError))}
                  >
                    Copiar detalhes
                  </button>
                </div>
              )}
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
                  <div className="mr-flex mr-items-center mr-justify-center mr-gap-2">
                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>@{profileUsername}</span>
                    {profilePlan === 'PRO' && (
                      <span className="mr-badge mr-badge-gold" style={{ fontSize: '0.65rem' }}>PRO</span>
                    )}
                  </div>

                  {createdAt && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--mr-text-secondary)', marginTop: 6 }}>
                      Membro desde {formatDate(createdAt)}
                    </div>
                  )}

                  <button
                    className="mr-btn mr-btn-sm mr-btn-outline"
                    style={{ marginTop: 12, display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
                    onClick={() => setEditMode(true)}
                  >
                    Editar perfil
                  </button>

                  <div
                    className="mr-flex mr-items-center mr-justify-center mr-gap-2"
                    style={{ fontSize: '0.8rem', color: 'var(--mr-text-secondary)', marginTop: 12, flexWrap: 'wrap' }}
                  >
                    <span>{profile?.isPublic ? '🌐 Perfil público' : '🔒 Perfil privado'}</span>
                    {profilePlan !== 'PRO' && (
                      <>
                        <span style={{ color: 'var(--mr-text-muted)' }}>·</span>
                        <span style={{ color: 'var(--mr-text-muted)' }}>🆓 Plano gratuito</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mini stats inline */}
            <div className="mr-grid-3col" style={{ textAlign: 'center' }}>
              {[
                { label: 'Obras', value: loadingWorks ? '—' : stats.obras },
                { label: 'Horas', value: loadingWorks ? '—' : `${stats.totalHours}h` },
                { label: 'Média', value: loadingWorks ? '—' : stats.avgNoteLabel },
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
              <div className="mr-flex mr-flex-wrap mr-justify-center mr-gap-2" style={{ minHeight: '1.4rem' }}>
                {loadingBadges ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>Carregando…</span>
                ) : unlockedCount === 0 ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>
                    Nenhuma conquista ainda.
                  </span>
                ) : (
                  badgeList.filter(b => b.unlocked).slice(0, 6).map(badge => (
                    <span
                      key={badge.id}
                      title={badge.name}
                      style={{ fontSize: '1.4rem', cursor: 'default', lineHeight: 1 }}
                    >
                      {badge.icon}
                    </span>
                  ))
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)', marginTop: 10 }}>
                {unlockedCount} de {badgeList.length} desbloqueadas
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
                {loadingWorks ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--mr-text-secondary)' }}>Carregando…</div>
                ) : activities.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--mr-text-secondary)' }}>
                    Nenhuma atividade ainda. Adicione obras pra começar. ✨
                  </div>
                ) : (
                  activities.map((activity, idx) => (
                    <div key={idx} style={{ borderRadius: 8, padding: '10px 12px', background: 'var(--mr-surface)', border: '1px solid var(--mr-border)' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{activity.text}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)', marginTop: 4 }}>{activity.time}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Destaques */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <h3 style={{ fontWeight: 700 }}>⭐ Destaques</h3>
              {loadingWorks ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--mr-text-secondary)' }}>Carregando…</div>
              ) : !highlights ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--mr-text-secondary)' }}>
                  Adicione obras pra ver seus destaques.
                </div>
              ) : (
                <div className="mr-space-y-3">
                  <KVRow
                    label="Melhor avaliada"
                    value={highlights.byNote?.title}
                    meta={highlights.byNote ? Number(highlights.byNote.note).toFixed(1) : null}
                  />
                  <KVRow
                    label="Mais horas"
                    value={highlights.byTime?.title}
                    meta={highlights.byTime ? hoursLabel(highlights.byTime.timeMinutes) : null}
                  />
                  <KVRow
                    label="Última adicionada"
                    value={highlights.byRecent?.title}
                    meta={highlights.byRecent ? relativeTime(highlights.byRecent.addedDate) : null}
                  />
                  <KVRow
                    label="Categoria favorita"
                    value={highlights.favCategory ? `${highlights.favCategory.icon} ${highlights.favCategory.label}` : '—'}
                    meta={highlights.favCategory ? `${highlights.favCategory.count}` : null}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Distribuição por categoria */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <h3 style={{ fontWeight: 700 }}>📊 Distribuição por categoria</h3>
              {loadingWorks ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--mr-text-secondary)' }}>Carregando…</div>
              ) : breakdown.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--mr-text-secondary)' }}>
                  Nenhuma obra ainda.
                </div>
              ) : (
                <div className="mr-space-y-3">
                  {breakdown.map((b) => (
                    <div key={b.type}>
                      <div
                        className="mr-flex mr-items-center mr-justify-between"
                        style={{ fontSize: '0.85rem', marginBottom: 4 }}
                      >
                        <span>{b.icon} {b.label}</span>
                        <span style={{ color: 'var(--mr-text-secondary)' }}>
                          {b.count} {b.count === 1 ? 'obra' : 'obras'} · média {b.avgLabel}
                        </span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--mr-surface)', border: '1px solid var(--mr-border)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.round(b.share * 100)}%`, height: '100%', background: 'var(--mr-gold)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Badges e Conquistas — largura total ── */}
      <div>
        <div className="mr-flex mr-items-center mr-gap-2 mr-flex-wrap" style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', marginRight: 'auto' }}>🏅 Badges e Conquistas</h2>

          {/* Filtro de badges — mesmo padrão toolbar */}
          <div className="mr-flex mr-gap-1">
            {[
              { id: 'all',      label: 'Todas'           },
              { id: 'unlocked', label: '✓ Desbloqueadas' },
              { id: 'locked',   label: '🔒 Bloqueadas'   },
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
            {loadingBadges ? '…' : `${unlockedCount} de ${badgeList.length}`}
          </div>
        </div>

        {loadingBadges ? (
          <div className="mr-card">
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
              Carregando conquistas…
            </div>
          </div>
        ) : visibleBadges.length === 0 ? (
          <div className="mr-card">
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
              Nenhuma badge neste filtro. 🔍
            </div>
          </div>
        ) : (
          <div className="mr-space-y-6">
            {visibleGroups.map(group => (
              <div key={group.key}>
                <div
                  className="mr-flex mr-items-center mr-gap-2"
                  style={{ marginBottom: 10, fontSize: '0.95rem', fontWeight: 700 }}
                >
                  <span>{group.icon} {group.label}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--mr-text-muted)' }}>
                    {group.items.filter(b => b.unlocked).length}/{group.items.length}
                  </span>
                </div>
                <div className="mr-badge-grid">
                  {group.items.map(badge => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {avatarModalOpen && (
        <AvatarUploadModal
          currentUser={profile}
          onClose={() => setAvatarModalOpen(false)}
          onDone={handleAvatarDone}
          onError={setAvatarError}
        />
      )}

    </div>
  );
}