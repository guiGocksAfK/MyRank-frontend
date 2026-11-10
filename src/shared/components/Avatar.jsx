import { useState } from 'react';
import { avatarUrlFor } from '../../services/userService';
import { useLanguage } from '../i18n';

const initialsFrom = (value) =>
  (value || 'U')
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U';

/**
 * Foto de perfil com fallback pras iniciais.
 * - `user`: { id, username, avatarUrl, updatedAt }
 * - `cacheKey`: muda pra forçar recarregar a imagem depois de um upload
 * - `className`: classe do wrapper (define tamanho/forma; ex.: mr-avatar, mr-avatar-lg)
 */
export default function Avatar({ user, cacheKey, className = 'mr-avatar', imgClassName = 'mr-avatar-img' }) {
  const { t } = useLanguage();
  const src = avatarUrlFor(user, cacheKey);
  // guarda QUAL endereço falhou: trocou a foto, o erro antigo deixa de valer sozinho
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = failedSrc === src;

  const initials = initialsFrom(user?.username);
  const ariaLabel = user?.username
    ? t.common.avatarOf.replace('{name}', user.username)
    : t.common.avatarDefault;

  return (
    <div className={className} aria-label={ariaLabel}>
      {src && !failed
        ? <img src={src} alt="" className={imgClassName} onError={() => setFailedSrc(src)} />
        : initials}
    </div>
  );
}
