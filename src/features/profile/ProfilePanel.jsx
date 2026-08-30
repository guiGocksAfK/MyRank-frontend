import React, { useState, useEffect } from 'react';
import { getMe, updateMe } from '../../services/userService';
import Avatar from '../../shared/components/Avatar';
import AvatarUrlModal from './AvatarUrlModal';
import { useUser } from '../../shared/userContext';
import { useLanguage, LANGUAGES } from '../../shared/i18n';
import {
  useUnifiedItems,
  computeStats,
  computeBreakdown,
  computeHighlights,
  relativeTime,
} from '../../shared/useUnifiedItems';
import { useBadges, groupByBucket } from '../../shared/badges';

// ─── helpers ───────────────────────────────────────────────────────────────
/** Interpola {chaves} de uma string de tradução. */
const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

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

function formatDate(dateString, locale) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(locale || 'pt-BR', {
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
  const { t } = useLanguage();
  const tp = t.profile;
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
            {tp.badgeUnlocked}
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
          <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)' }}>{tp.badgeLocked}</span>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────
export default function ProfilePanel({ isDark, onThemeToggle }) {
  const { t, lang, setLang, locale } = useLanguage();
  const tp = t.profile;

  const [profileUsername, setProfileUsername] = useState('usuario');
  const [profileBio,      setProfileBio]      = useState('');
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
  const [avatarVersion,   setAvatarVersion]   = useState(0);     // muda pra furar o cache do <img> após troca
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
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
        setProfileBio(user.bio || tp.defaultBio);
        setProfilePlan(user.plan || 'FREE');
        setCreatedAt(user.createdAt || null);
      } catch (err) {
        setError(tp.loadError);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarDone = (freshUser) => {
    applyUser(freshUser);
    setAvatarVersion((v) => v + 1);
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
      const message = err.response?.data?.message || tp.saveError;
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
      text: fmt(tp.added, { title: w.title }),
      time: relativeTime(w.addedDate, lang),
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
        <div className="mr-card-body">{tp.loading}</div>
      </div>
    );
  }

  return (
    <div className="mr-space-y-6">

      {/* ── Header ── */}
      <div className="mr-flex mr-items-center mr-justify-between mr-flex-wrap mr-gap-4">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{tp.title}</h1>
          <p style={{ color: 'var(--mr-text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            {tp.subtitle}
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
                  {tp.changePhoto}
                </button>
              )}
            </div>

            <div style={{ textAlign: 'left', width: '100%' }}>
              {editMode ? (
                <div className="mr-space-y-3">
                  <div>
                    <label className="mr-setting-label" style={{ marginBottom: 6 }}>{tp.usernameLabel}</label>
                    <input
                      className="mr-input"
                      value={draftUsername}
                      onChange={e => setDraftUsername(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label className="mr-setting-label" style={{ marginBottom: 6 }}>{tp.bioLabel}</label>
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
                      {tp.cancel}
                    </button>
                    <button className="mr-btn mr-btn-gold mr-btn-sm" onClick={handleSave} disabled={saving}>
                      {saving ? tp.saving : tp.save}
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
                      {fmt(tp.memberSince, { date: formatDate(createdAt, locale) })}
                    </div>
                  )}

                  <button
                    className="mr-btn mr-btn-sm mr-btn-outline"
                    style={{ marginTop: 12, display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
                    onClick={() => setEditMode(true)}
                  >
                    {tp.editProfile}
                  </button>

                  <div
                    className="mr-flex mr-items-center mr-justify-center mr-gap-2"
                    style={{ fontSize: '0.8rem', color: 'var(--mr-text-secondary)', marginTop: 12, flexWrap: 'wrap' }}
                  >
                    <span>{profile?.isPublic ? tp.publicProfile : tp.privateProfile}</span>
                    {profilePlan !== 'PRO' && (
                      <>
                        <span style={{ color: 'var(--mr-text-muted)' }}>·</span>
                        <span style={{ color: 'var(--mr-text-muted)' }}>{tp.freePlan}</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mini stats inline */}
            <div className="mr-grid-3col" style={{ textAlign: 'center' }}>
              {[
                { label: tp.statWorks, value: loadingWorks ? '—' : stats.obras },
                { label: tp.statHours, value: loadingWorks ? '—' : `${stats.totalHours}h` },
                { label: tp.statAvg,   value: loadingWorks ? '—' : stats.avgNoteLabel },
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
                {tp.quickBadges}
              </div>
              <div className="mr-flex mr-flex-wrap mr-justify-center mr-gap-2" style={{ minHeight: '1.4rem' }}>
                {loadingBadges ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>{tp.loadingShort}</span>
                ) : unlockedCount === 0 ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-secondary)' }}>
                    {tp.noBadgesYet}
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
                {fmt(tp.unlockedOf, { n: unlockedCount, m: badgeList.length })}
              </div>
            </div>

          </div>
        </div>

        {/* ── Coluna direita: configurações ── */}
        <div className="mr-space-y-6">

          {/* Aparência (RF-012) — modo escuro + idioma, meia a meia */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <h3 style={{ fontWeight: 700 }}>{tp.appearance}</h3>
              <div className="mr-appearance-split">
                <SettingRow label={tp.darkMode} desc={tp.darkModeDesc}>
                  <button
                    className={`mr-switch ${isDark ? 'checked' : ''}`}
                    onClick={onThemeToggle}
                  >
                    <span className="mr-switch-thumb" />
                  </button>
                </SettingRow>

                <SettingRow label={tp.language} desc={tp.languageDesc}>
                  <div className="mr-lang-seg" role="group" aria-label={tp.language}>
                    {LANGUAGES.map((code) => (
                      <button
                        key={code}
                        type="button"
                        className={`mr-lang-seg-btn ${lang === code ? 'is-active' : ''}`}
                        onClick={() => setLang(code)}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </SettingRow>
              </div>
            </div>
          </div>

          {/* Histórico de atividade */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <div className="mr-flex mr-items-center mr-justify-between">
                <h3 style={{ fontWeight: 700 }}>{tp.history}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)' }}>
                  {tp.lastActions}
                </span>
              </div>

              <div className="mr-space-y-3">
                {loadingWorks ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--mr-text-secondary)' }}>{tp.loadingShort}</div>
                ) : activities.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--mr-text-secondary)' }}>
                    {tp.noActivity}
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
              <h3 style={{ fontWeight: 700 }}>{tp.highlights}</h3>
              {loadingWorks ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--mr-text-secondary)' }}>{tp.loadingShort}</div>
              ) : !highlights ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--mr-text-secondary)' }}>
                  {tp.noHighlights}
                </div>
              ) : (
                <div className="mr-space-y-3">
                  <KVRow
                    label={tp.bestRated}
                    value={highlights.byNote?.title}
                    meta={highlights.byNote ? Number(highlights.byNote.note).toFixed(1) : null}
                  />
                  <KVRow
                    label={tp.mostHours}
                    value={highlights.byTime?.title}
                    meta={highlights.byTime ? hoursLabel(highlights.byTime.timeMinutes) : null}
                  />
                  <KVRow
                    label={tp.lastAdded}
                    value={highlights.byRecent?.title}
                    meta={highlights.byRecent ? relativeTime(highlights.byRecent.addedDate, lang) : null}
                  />
                  <KVRow
                    label={tp.favCategory}
                    value={highlights.favCategory ? `${highlights.favCategory.icon} ${t.common.mediaTypes[highlights.favCategory.type] || highlights.favCategory.label}` : '—'}
                    meta={highlights.favCategory ? `${highlights.favCategory.count}` : null}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Distribuição por categoria */}
          <div className="mr-card">
            <div className="mr-card-body mr-space-y-4">
              <h3 style={{ fontWeight: 700 }}>{tp.distribution}</h3>
              {loadingWorks ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--mr-text-secondary)' }}>{tp.loadingShort}</div>
              ) : breakdown.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--mr-text-secondary)' }}>
                  {tp.noWorks}
                </div>
              ) : (
                <div className="mr-space-y-3">
                  {breakdown.map((b) => (
                    <div key={b.type}>
                      <div
                        className="mr-flex mr-items-center mr-justify-between"
                        style={{ fontSize: '0.85rem', marginBottom: 4 }}
                      >
                        <span>{b.icon} {t.common.mediaTypes[b.type] || b.label}</span>
                        <span style={{ color: 'var(--mr-text-secondary)' }}>
                          {fmt(b.count === 1 ? tp.distLineOne : tp.distLineMany, { count: b.count, avg: b.avgLabel })}
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
      <div id="mr-badges" style={{ scrollMarginTop: 80 }}>
        <div className="mr-flex mr-items-center mr-gap-2 mr-flex-wrap" style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', marginRight: 'auto' }}>{tp.badgesTitle}</h2>

          {/* Filtro de badges — mesmo padrão toolbar */}
          <div className="mr-flex mr-gap-1">
            {[
              { id: 'all',      label: tp.filterAll      },
              { id: 'unlocked', label: tp.filterUnlocked },
              { id: 'locked',   label: tp.filterLocked   },
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
            {loadingBadges ? '…' : fmt(tp.unlockedShort, { n: unlockedCount, m: badgeList.length })}
          </div>
        </div>

        {loadingBadges ? (
          <div className="mr-card">
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
              {tp.loadingBadges}
            </div>
          </div>
        ) : visibleBadges.length === 0 ? (
          <div className="mr-card">
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--mr-text-secondary)', fontSize: '0.875rem' }}>
              {tp.noBadgesFilter}
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
                  <span>{group.icon} {t.common.badgeBuckets[group.key] || group.label}</span>
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
        <AvatarUrlModal
          currentUser={profile}
          onClose={() => setAvatarModalOpen(false)}
          onDone={handleAvatarDone}
        />
      )}

    </div>
  );
}
