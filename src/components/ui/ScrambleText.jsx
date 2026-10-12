import { useState, useEffect, useRef } from 'react';

const SCRAMBLE_CHARS = '0123456789ABCDEF·#%&X_';

export function ScrambleText({ text, duration = 320, className = '' }) {
  const [displayText, setDisplayText] = useState(text);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    // If reduced motion is requested, do not animate
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    startTimeRef.current = performance.now();

    const updateScramble = (now) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / duration);

      if (progress >= 1) {
        setDisplayText(text);
        return;
      }

      // Calculate how many characters are resolved
      const resolvedCount = Math.floor(progress * text.length);
      let result = '';

      for (let i = 0; i < text.length; i++) {
        if (i < resolvedCount || text[i] === ' ' || text[i] === ':' || text[i] === '·' || text[i] === '/') {
          result += text[i];
        } else {
          result += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }

      setDisplayText(result);
      animationRef.current = requestAnimationFrame(updateScramble);
    };

    animationRef.current = requestAnimationFrame(updateScramble);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [text, duration]);

  return <span className={className}>{displayText}</span>;
}
