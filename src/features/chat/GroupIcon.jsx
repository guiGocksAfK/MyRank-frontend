import { useEffect, useState } from 'react';

/** Ícone de grupo: foto (URL) quando tem, senão iniciais do nome num círculo. */
export default function GroupIcon({ name, imageUrl, className = 'chat-conv-avatar' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [imageUrl]);

  const initials =
    (name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || '?';

  if (imageUrl && !failed) {
    return (
      <div className={className} aria-hidden="true">
        <img src={imageUrl} alt="" onError={() => setFailed(true)} />
      </div>
    );
  }

  return (
    <div className={`${className} chat-group-icon`} aria-hidden="true">
      {initials}
    </div>
  );
}
