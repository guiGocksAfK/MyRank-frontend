import { useState } from 'react';

/**
 * Avatar de usuário: foto quando disponível, senão as iniciais num círculo
 * neutro (preto e dourado; as cores de arco-íris de antes fugiam do visual).
 */
export default function SocialAvatar({ name = '?', initials, src, size = 36 }) {
  // guarda qual endereço falhou: trocou a foto, tenta a nova sem precisar de efeito
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = failedSrc === src;

  const text =
    initials ||
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();

  const base = {
    width: size,
    height: size,
    flexShrink: 0,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  if (src && !failed) {
    return (
      <span aria-hidden="true" style={base}>
        <img
          src={src}
          alt=""
          onError={() => setFailedSrc(src)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        ...base,
        background: 'var(--mr-muted-bg)',
        boxShadow: 'inset 0 0 0 1px var(--mr-border)',
        color: 'var(--mr-text-secondary)',
        fontWeight: 700,
        fontSize: size * 0.4,
        lineHeight: 1,
        letterSpacing: '0.02em',
      }}
    >
      {text}
    </span>
  );
}
