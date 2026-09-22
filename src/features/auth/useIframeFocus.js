import { useEffect, useRef, useState } from "react";

// O botao real do Google e um iframe invisivel: quando ele recebe foco (Tab),
// a pagina so percebe um "blur" da janela com o iframe como activeElement.
export default function useIframeFocus() {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const handleBlur = () => {
      // activeElement so aponta pro iframe depois do evento de blur.
      // hasFocus() distingue "foco entrou no iframe" de "janela inteira perdeu o foco".
      setTimeout(() => {
        const active = document.activeElement;
        setFocused(
          document.hasFocus() && active?.tagName === "IFRAME" && !!ref.current?.contains(active)
        );
      }, 0);
    };
    const handleFocus = () => setFocused(false);

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return [ref, focused];
}
