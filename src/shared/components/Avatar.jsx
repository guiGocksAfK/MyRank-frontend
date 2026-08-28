import { useEffect, useState } from 'react';
import { avatarUrlFor } from '../../services/userService';

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
  const src = avatarUrlFor(user, cacheKey);
  const [failed, setFailed] = useState(false);

  useEffect(() => { setFailed(false); }, [src]);

  const initials = initialsFrom(user?.username);

  return (
    <div className={className} aria-label={user?.username ? `Foto de ${user.username}` : 'Foto de perfil'}>
      {src && !failed
        ? <img src={src} alt="" className={imgClassName} onError={() => setFailed(true)} />
        : initials}
    </div>
  );
}
