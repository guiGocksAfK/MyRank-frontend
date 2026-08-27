import { useEffect, useState } from 'react';

export default function AnimatedNumber({ value, decimals = 1, prefix = '', suffix = '' }) {
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

  return <>{prefix}{displayValue.toFixed(decimals)}{suffix}</>;
}
