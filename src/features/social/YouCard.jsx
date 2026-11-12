import { useEffect, useState } from 'react';
import { useLanguage } from '../../shared/i18n';
import { useUser } from '../../shared/userContext';
import { socialApi, lastSocial } from './socialData';
import SocialAvatar from './SocialAvatar';

/**
 * Você numa linha: foto e nome (abrem o seu perfil) e as contagens (cada uma
 * abre a lista). Em tela grande mora na coluna da esquerda; nas outras, no topo
 * do trilho. `bare`: sem caixa em volta (coluna da esquerda).
 */
export default function YouCard({ onOpenUser, onOpenConnections, refreshKey = 0, bare = false, className = '' }) {
  const { t } = useLanguage();
  const tr = t.social.rail;
  const { user } = useUser();
  const [summary, setSummary] = useState(() => lastSocial('getSummary') ?? null);

  useEffect(() => {
    let alive = true;
    socialApi.getSummary()
      .then((s) => { if (alive) setSummary(s); })
      .catch(() => { if (alive) setSummary({ following: 0, followers: 0 }); });
    return () => { alive = false; };
  }, [refreshKey]);

  const openMe = () => user && onOpenUser?.(user.id);

  return (
    <section className={`${bare ? '' : 'mr-panel '}social-you ${className}`.trim()}>
      <button type="button" className="social-you-photo" onClick={openMe} aria-label={tr.seeMyProfile} title={tr.seeMyProfile}>
        <SocialAvatar name={user?.username || '?'} src={user?.avatarUrl} size={40} />
      </button>
      <div className="social-you-text">
        <button type="button" className="social-you-name" onClick={openMe}>
          <span className="social-person-name">{user?.username}</span>
          <span className="social-you-link">{tr.seeMyProfile}</span>
        </button>
        <span className="social-you-counts">
          <button type="button" onClick={() => onOpenConnections('following')}>
            <b>{summary?.following ?? '—'}</b> {tr.followingWord}
          </button>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => onOpenConnections('followers')}>
            <b>{summary?.followers ?? '—'}</b> {tr.followersWord}
          </button>
        </span>
      </div>
    </section>
  );
}
