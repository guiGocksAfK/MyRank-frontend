import { useState } from 'react';

/** Ícone de grupo: foto (URL) quando tem, senão iniciais do nome num círculo. */
export default function GroupIcon({ name, imageUrl, className = 'chat-conv-avatar' }) {
  // guarda QUAL endereço falhou: trocou a foto, o erro antigo deixa de valer sozinho
  const [failedUrl, setFailedUrl] = useState(null);
  const failed = failedUrl === imageUrl;

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
        <img src={imageUrl} alt="" onError={() => setFailedUrl(imageUrl)} />
      </div>
    );
  }

  return (
    <div className={`${className} chat-group-icon`} aria-hidden="true">
      {initials}
    </div>
  );
}
