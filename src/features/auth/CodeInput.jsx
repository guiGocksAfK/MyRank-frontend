import { useState } from "react";

/**
 * Código de verificação com um quadrado por dígito. Por baixo é um campo só,
 * invisível e esticado sobre os quadrados: colar o código inteiro, o
 * preenchimento automático do celular (one-time-code) e o apagar continuam
 * funcionando sem lógica de pular de campo em campo.
 */
const CodeInput = ({ id, value, onChange, length = 6, disabled = false, invalid = false, autoFocus = false }) => {
  const [focused, setFocused] = useState(false);
  const active = focused && value.length < length ? value.length : -1;

  const classes = ["auth-code"];
  if (invalid) classes.push("is-invalid");
  if (disabled) classes.push("is-disabled");

  return (
    <span className={classes.join(" ")}>
      {Array.from({ length }, (_, i) => (
        <span
          key={i}
          className={`auth-code-box${value[i] ? " is-filled" : ""}${i === active ? " is-active" : ""}`}
          aria-hidden="true"
        >
          {value[i] ?? (i === active && <span className="auth-code-caret" />)}
        </span>
      ))}
      <input
        id={id}
        name={id}
        className="auth-code-input"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        autoFocus={autoFocus}
        value={value}
        readOnly={disabled} // disabled tiraria o foco; após um erro a pessoa já digita de novo
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-invalid={invalid || undefined}
      />
    </span>
  );
};

export default CodeInput;
