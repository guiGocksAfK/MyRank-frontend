/** Ícone de grupo: iniciais do nome num círculo (sem upload de foto no v1). */
export default function GroupIcon({ name, className = 'chat-conv-avatar' }) {
  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || '?';
  return (
    <div className={`${className} chat-group-icon`} aria-hidden="true">
      {initials}
    </div>
  );
}
