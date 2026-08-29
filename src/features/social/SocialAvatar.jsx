import { useEffect, useState } from 'react';

/** Avatar de usuário: foto quando disponível, senão iniciais coloridas. */
export default function SocialAvatar({ name = '?', color = 'var(--mr-gold)', initials, src, size = 36 }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

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
          onError={() => setFailed(true)}
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
        background: color,
        color: '#fff',
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
