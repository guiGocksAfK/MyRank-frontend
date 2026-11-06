import { useEffect, useState } from 'react';

/** Sem `locale`, mantém o ponto decimal (como as notas nas tabelas); com ele, segue o idioma (9,9). */
export default function AnimatedNumber({ value, decimals = 1, prefix = '', suffix = '', locale }) {
  const numericValue = Number(value) || 0;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 550;
    let frameId;

    function animate(currentTime) {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress = 1 - ((1 - progress) ** 3);
      setDisplayValue(numericValue * easedProgress);
      if (progress < 1) frameId = requestAnimationFrame(animate);
    }

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [numericValue]);

  const text = locale
    ? displayValue.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : displayValue.toFixed(decimals);
  return <>{prefix}{text}{suffix}</>;
}
