/**
 * Estado vazio do Social: um convite, não um pedido de desculpas. Ícone de
 * traço + título + texto + um botão que leva pro lugar certo (opcionais).
 * `compact`: versão sem moldura, pra dentro de uma coluna que já é um cartão.
 */
export default function SocialEmpty({ icon: Icon, title, text, actionLabel, onAction, compact = false }) {
  return (
    <div className={`social-empty${compact ? ' is-compact' : ''}`}>
      {Icon && (
        <span className="social-empty-icon" aria-hidden="true">
          <Icon size={compact ? 20 : 26} strokeWidth={1.6} />
        </span>
      )}
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
