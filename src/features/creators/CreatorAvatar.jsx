import { useState } from 'react';
import { Pencil } from 'lucide-react';

function initials(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Uma pessoa/estúdio: foto, logo (estúdio, num fundo claro: logo costuma ser escuro) ou iniciais. */
function Face({ member, profile, isCompany }) {
  const [failed, setFailed] = useState(null);
  const url = profile?.photoUrl;
  const showPhoto = url && failed !== url;
  // logo só vale como logo se for a automática; foto própria ocupa o círculo todo
  const asLogo = showPhoto && isCompany && !profile?.customPhoto;
  return (
    <span className={`cr-face${asLogo ? ' is-logo' : ''}`} title={member.name}>
      {showPhoto
        ? <img src={url} alt="" loading="lazy" onError={() => setFailed(url)} />
        : <span className="cr-face-initials">{initials(member.name)}</span>}
    </span>
  );
}

/**
 * Retrato redondo do criador (redondo = pessoa/estúdio; retângulo = obra). Dupla é
 * um círculo só, metade pra cada rosto. Com `onEdit`, o retrato vira o botão de
 * editar (como foto de perfil): escurece e mostra o lápis ao passar o mouse.
 */
export default function CreatorAvatar({ entry, profiles, isCompany, size = 'md', top = false, onEdit, editLabel }) {
  const members = entry.members.slice(0, 2);
  const avatar = (
    <span className={`cr-avatar is-${size}${members.length > 1 ? ' is-duo' : ''}${top ? ' is-top' : ''}`} aria-hidden="true">
      {members.map(member => (
        <Face key={member.key} member={member} profile={profiles[member.key]} isCompany={isCompany} />
      ))}
    </span>
  );
  if (!onEdit) return avatar;
  return (
    <button type="button" className={`cr-avatar-btn is-${size}`} aria-label={editLabel} title={editLabel}
      onClick={(event) => { event.stopPropagation(); onEdit(); }}
      onKeyDown={(event) => event.stopPropagation()}>
      {avatar}
      <span className="cr-avatar-edit" aria-hidden="true"><Pencil strokeWidth={2} /></span>
    </button>
  );
}
