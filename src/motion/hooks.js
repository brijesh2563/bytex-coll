import { useState, useEffect } from 'react';
import { prefersReducedMotion } from './tokens';

/**
 * Scramble text effect for cryptographic hashes and version numbers.
 * @param {string} finalValue - Target string to settle onto
 * @param {boolean} trigger - When true, triggers scramble
 * @param {number} [duration=600] - Duration in ms
 * @returns {string} - Current scrambled or settled string
 */
export function useScramble(finalValue, trigger, duration = 600) {
  const [scrambledValue, setScrambledValue] = useState(finalValue);
  const chars = '0123456789abcdef';

  useEffect(() => {
    if (!trigger || prefersReducedMotion()) {
      return;
    }

    let startTime = performance.now();
    let frameId;

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const settledCount = Math.floor(progress * finalValue.length);

      let result = '';
      for (let i = 0; i < finalValue.length; i++) {
        if (i < settledCount) {
          result += finalValue[i];
        } else {
          result += chars[Math.floor(Math.random() * chars.length)];
        }
      }

      setScrambledValue(result);

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      } else {
        setScrambledValue(finalValue);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [finalValue, trigger, duration]);

  if (!trigger || prefersReducedMotion()) {
    return finalValue;
  }

  return scrambledValue;
}
