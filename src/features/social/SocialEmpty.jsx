/** Estado vazio reutilizável do Social: ícone + título + texto + CTA opcional. */
export default function SocialEmpty({ icon = '🌱', title, text, actionLabel, onAction }) {
  return (
    <div className="social-empty">
      <div className="social-empty-icon" aria-hidden="true">{icon}</div>
      {title && <div className="social-empty-title">{title}</div>}
      {text && <p className="social-empty-text">{text}</p>}
      {actionLabel && onAction && (
        <button type="button" className="mr-btn mr-btn-gold mr-btn-sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
