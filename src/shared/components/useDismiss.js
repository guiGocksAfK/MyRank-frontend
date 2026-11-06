import { useEffect } from "react";

/**
 * Fecha um menu aberto ao clicar fora dele ou apertar Esc (aí o foco volta pro
 * botão que abriu). {@code boxRef} envolve botão + menu.
 */
export default function useDismiss(open, close, boxRef, buttonRef) {
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!boxRef.current?.contains(e.target)) close();
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        close();
        buttonRef?.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close, boxRef, buttonRef]);
}
