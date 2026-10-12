/**
 * @file src/motion/tokens.js
 * @description Exact motion tokens for the Observatory Instrument design system.
 * Strictly enforces consistent physics, easings, durations, and springs.
 */

export const DURATION = Object.freeze({
  instant: 120,
  quick: 240,
  base: 480,
  slow: 800,
  cinematic: 1400,
});

export const EASING = Object.freeze({
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  outQuint: 'cubic-bezier(0.22, 1, 0.36, 1)', // Default
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  mechanical: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
});

export const SPRINGS = Object.freeze({
  soft: { stiffness: 120, damping: 18 },
  ui: { stiffness: 300, damping: 30 },
  snap: { stiffness: 420, damping: 16 },
});

export const STAGGER = Object.freeze({
  tight: 40,
  standard: 60,
  loose: 80,
});

/**
 * Returns true if the user has requested reduced motion.
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
