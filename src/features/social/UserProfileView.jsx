import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Lock, MessageSquare, Pencil, Scale } from 'lucide-react';
import { useUnifiedItems } from '../../shared/useUnifiedItems';
import { useLanguage } from '../../shared/i18n';
import { useChat } from '../../shared/chat';
import { useUser } from '../../shared/userContext';
import EditProfileModal from '../profile/EditProfileModal';
import SelfQuickSettings from './SelfQuickSettings';
import { BADGE_I18N } from '../../shared/badgeI18n';
import BadgeIcon from '../../shared/badgeIcons';
import { socialApi, computeTasteMatch, tasteKey, typeIconFor, MATCH_MIN_SHARED } from './socialData';
import SocialAvatar from './SocialAvatar';

const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

/**
 * Perfil de alguém na Social: cabeçalho com as ações, o gosto parecido com o
 * seu, as obras do topo (com a sua nota ao lado, quando você também avaliou), a
 * divisão por tipo e as conquistas. Perfil privado que você não segue mostra
 * só o cabeçalho.
 * O seu próprio perfil abre igual, "como os outros veem", com Editar perfil e
 * os ajustes rápidos no lugar de seguir, comparar e o gosto parecido.
 */
export default function UserProfileView({ userId, onBack, onCompare, onToggleFollow, onNavigate, onBeforeMessage }) {
  const { t, lang, locale } = useLanguage();
  const tv = t.social.profile;
  const { openChatWith } = useChat();
  const { user, setUser } = useUser();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reload, setReload] = useState(0); // recarrega depois de editar o seu perfil
  const [failedUrls, setFailedUrls] = useState(() => new Set());
  const markFailed = (url) => setFailedUrls((prev) => new Set(prev).add(url));
  const { items: myItems } = useUnifiedItems();

  useEffect(() => {
    let alive = true;
    socialApi.getProfile(userId)
      .then((p) => { if (alive) setProfile(p); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [userId, reload]);

  const isSelf = !!user && profile?.id === user.id;
  const onSelfSaved = (updated) => {
    setUser(updated);
    setReload((n) => n + 1);
  };

  const match = useMemo(
    () => (profile && myItems ? computeTasteMatch(myItems, profile.works) : null),
    [profile, myItems],
  );
  const myScores = useMemo(() => {
    const map = new Map();
    (myItems || []).forEach((i) => {
      const n = Number(i.note);
      if (i.title && Number.isFinite(n) && n > 0) map.set(tasteKey(i.title, i.type), n);
    });
    return map;
  }, [myItems]);

  const note = (n) => Number(n).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const back = (
    <button type="button" className="social-back" onClick={onBack}>
      <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
      {tv.back}
    </button>
  );

  if (error) return <div className="social-sub">{back}<p className="social-rail-empty">{tv.loadError}</p></div>;
  if (!profile || profile.id !== Number(userId)) {
    return <div className="social-sub">{back}<p className="social-rail-empty">{tv.loading}</p></div>;
  }

  const counts = (
    <span className="social-prof-counts">
      <span><b>{profile.followerCount ?? 0}</b> {tv.followersWord}</span>
      <span><b>{profile.followingCount ?? 0}</b> {tv.followingWord}</span>
    </span>
  );

  // privado e você não segue: só o cabeçalho e o convite pra seguir
  if (profile.locked) {
    return (
      <div className="social-sub">
        {back}
        <section className="mr-panel social-prof-locked">
          <SocialAvatar name={profile.username} initials={profile.initials} src={profile.avatarSrc} size={72} />
          <h2 className="social-prof-name">{profile.username}</h2>
          {counts}
          <span className="social-prof-lock"><Lock size={18} strokeWidth={1.8} aria-hidden="true" /></span>
          <strong>{tv.privateTitle}</strong>
          <p className="social-muted">{tv.privateText}</p>
          <FollowButton profile={profile} onToggleFollow={onToggleFollow} tv={tv} />
        </section>
      </div>
    );
  }

  const enough = match && match.sharedCount >= MATCH_MIN_SHARED && match.matchPct != null;
  const gap = match?.disagreements[0];
  // por tipo: quantas obras e a média que a pessoa dá pra aquele tipo
  const typeAvg = new Map();
  profile.works.forEach((w) => {
    if (w.score == null) return;
    const cur = typeAvg.get(w.type) || { sum: 0, n: 0 };
    typeAvg.set(w.type, { sum: cur.sum + Number(w.score), n: cur.n + 1 });
  });
  const breakdown = Object.entries(profile.breakdown).sort((a, b) => b[1] - a[1]);

  return (
    <div className="social-sub">
      {back}

      <section className="mr-panel social-prof-head">
        <SocialAvatar name={profile.username} initials={profile.initials} src={profile.avatarSrc} size={72} />
        <div className="social-prof-who">
          <div className="social-prof-line">
            <h2 className="social-prof-name">{profile.username}</h2>
            {isSelf && <span className="social-tag">{tv.selfTag}</span>}
            {!isSelf && profile.followsYou && <span className="social-tag">{tv.followsYou}</span>}
          </div>
          {profile.bio && <p className="social-prof-bio">{profile.bio}</p>}
          <span className="social-prof-stats">
            {fmt(tv.stats, { works: profile.stats.works, avg: note(profile.stats.avgScore) })}
          </span>
          {counts}
        </div>
        {isSelf ? (
          <div className="social-prof-actions">
            <button type="button" className="mr-btn mr-btn-outline mr-btn-sm" onClick={() => setEditing(true)}>
              <Pencil size={14} strokeWidth={2} aria-hidden="true" />
              {t.profile.editProfile}
            </button>
          </div>
        ) : (
          <div className="social-prof-actions">
            <FollowButton profile={profile} onToggleFollow={onToggleFollow} tv={tv} />
            <button type="button" className="mr-btn mr-btn-outline mr-btn-sm" onClick={() => onCompare(profile.id)}>
              <Scale size={14} strokeWidth={2} aria-hidden="true" />
              {tv.compare}
            </button>
            <button
              type="button"
              className="mr-btn mr-btn-outline mr-btn-sm"
              onClick={() => {
                onBeforeMessage?.();
                openChatWith({ id: profile.id, username: profile.username, avatarUrl: profile.avatarUrl });
              }}
            >
              <MessageSquare size={14} strokeWidth={2} aria-hidden="true" />
              {tv.message}
            </button>
          </div>
        )}
      </section>

      {isSelf && (
        <>
          <p className="social-self-hint">{tv.selfHint}</p>
          <SelfQuickSettings
            user={user}
            onSaved={onSelfSaved}
            onMore={() => onNavigate?.('profile', { settings: true })}
          />
        </>
      )}

      {/* gosto parecido: a % grande em dourado e onde vocês mais concordam/discordam */}
      {!isSelf && (
        <section className="mr-panel social-prof-match">
          {!match ? (
            <p className="social-rail-empty">{tv.calculating}</p>
          ) : !enough ? (
            <p className="social-rail-empty">
              {match.sharedCount === 0 ? tv.noCommon : fmt(tv.fewCommon, { n: match.sharedCount })}
            </p>
          ) : (
            <>
              <div className="social-prof-pct">
                <b>{match.matchPct}%</b>
                <span>{tv.match}</span>
              </div>
              <div className="social-prof-why">
                <span className="social-prof-common">{fmt(tv.inCommon, { n: match.sharedCount })}</span>
                {match.agreements[0] && (
                  <span>{tv.alignedIn} <strong>{match.agreements[0].title}</strong></span>
                )}
                {gap && (
                  <span>
                    {tv.disagreeIn} <strong>{gap.title}</strong>{' '}
                    <span className="social-muted">({note(gap.mine)} × {note(gap.theirs)})</span>
                  </span>
                )}
              </div>
            </>
          )}
        </section>
      )}

      <div className="social-prof-grid">
        <section className="mr-panel social-col">
          <h2 className="social-rail-title">{tv.topWorks}</h2>
          <ol className="social-prof-top">
            {profile.top.slice(0, 10).map((w, i) => {
              const mine = isSelf ? null : myScores.get(tasteKey(w.title, w.type));
              return (
                <li key={`${w.title}-${i}`}>
                  <span className="social-prof-rank">{i + 1}</span>
                  <span className="social-prof-cover">
                    {w.imageUrl && !failedUrls.has(w.imageUrl)
                      ? <img src={w.imageUrl} alt="" loading="lazy" onError={() => markFailed(w.imageUrl)} />
                      : typeIconFor(w.type, 14)}
                  </span>
                  <span className="social-prof-title">{w.title}</span>
                  <span className="social-work-scores">
                    <span className="social-work-score">{note(w.score)}</span>
                    {mine != null && <span className="social-work-mine">{t.social.act.you} <b>{note(mine)}</b></span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="social-prof-side">
          <section className="mr-panel social-col">
            <h2 className="social-rail-title">{tv.distribution}</h2>
            <ul className="social-prof-types">
              {breakdown.map(([type, n]) => {
                const a = typeAvg.get(type);
                return (
                  <li key={type}>
                    <span className="social-prof-type">
                      {typeIconFor(type, 13)}
                      {t.common.mediaTypes[type] || type}
                    </span>
                    <b className="social-prof-n">{n}</b>
                    {a?.n > 0 && <span className="social-prof-avg">{fmt(tv.typeAvg, { avg: note(a.sum / a.n) })}</span>}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mr-panel social-col">
            <h2 className="social-rail-title">{tv.achievements}</h2>
            {profile.badges.length === 0 ? (
              <p className="social-rail-empty">{tv.noBadges}</p>
            ) : (
              <div className="social-prof-badges">
                {profile.badges.map((b) => (
                  <span key={b.code || b.name} className="social-prof-badge">
                    <BadgeIcon code={b.code} />
                    {BADGE_I18N[lang]?.[b.code]?.name || b.name}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {editing && (
        <EditProfileModal
          profile={user}
          onClose={() => setEditing(false)}
          onSaved={(updated) => { onSelfSaved(updated); setEditing(false); }}
        />
      )}
    </div>
  );
}

/** Seguir com 3 estados: Seguindo · Solicitado · Seguir (ou Pedir pra seguir, se for privado). */
function FollowButton({ profile, onToggleFollow, tv }) {
  const [following, setFollowing] = useState(profile.following);
  const [requested, setRequested] = useState(profile.requested);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    if (following) setFollowing(false);
    else if (requested) setRequested(false);
    else if (profile.isPublic === false) setRequested(true);
    else setFollowing(true);
    try {
      const updated = await onToggleFollow(profile.id);
      if (updated) {
        setFollowing(updated.following);
        setRequested(updated.requested);
      }
    } catch {
      setFollowing(profile.following);
      setRequested(profile.requested);
    } finally {
      setBusy(false);
    }
  }

  const label = following ? tv.following : requested ? tv.requested : profile.isPublic === false ? tv.request : tv.follow;
  return (
    <button
      type="button"
      className={`mr-btn mr-btn-sm ${following || requested ? 'mr-btn-outline' : 'mr-btn-gold'}`}
      onClick={toggle}
      disabled={busy}
    >
      {label}
    </button>
  );
}
