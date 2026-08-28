/** Avatar de iniciais coloridas pra usuários do mock social. */
export default function SocialAvatar({ name = '?', color = 'var(--mr-gold)', initials, size = 36 }) {
  const text =
    initials ||
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();

  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        background: color,
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
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
