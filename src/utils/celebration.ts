/**
 * High-Performance, Canvas-Free Royal Celebration Engine
 * 
 * Replaces `canvas-confetti` with a 100% pure DOM/CSS hardware-accelerated
 * particle burst. Eliminates WebView GPU context loss, white screens,
 * and flickering when returning from native/web fullscreen ads.
 */

export type CelebrationMode = 'dom' | 'off';

const STORAGE_KEY = 'cuizin_celebration_mode';

/**
 * Get current celebration mode ('dom' or 'off')
 */
export function getCelebrationMode(): CelebrationMode {
  if (typeof window === 'undefined') return 'dom';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'off' || saved === 'dom') return saved;
  } catch {}
  return 'dom';
}

/**
 * Set celebration mode ('dom' or 'off')
 */
export function setCelebrationMode(mode: CelebrationMode) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {}
  if (mode === 'off') {
    cleanupCelebrations();
  }
}

/**
 * Check if celebration is enabled
 */
export function isCelebrationEnabled(): boolean {
  return getCelebrationMode() === 'dom';
}

/**
 * Remove any legacy canvas elements left by canvas-confetti or other scripts,
 * as well as any active celebration containers.
 */
export function cleanupCelebrations() {
  if (typeof document === 'undefined') return;
  try {
    // 1. Remove all active DOM celebration containers
    document.querySelectorAll('.cuizin-celebration-container').forEach((el) => el.remove());

    // 2. Remove any fixed fullscreen canvas elements attached to document.body
    document.querySelectorAll('canvas').forEach((c) => {
      if (
        c.parentElement === document.body &&
        (c.style.position === 'fixed' || !c.id)
      ) {
        try {
          c.remove();
        } catch {}
      }
    });
  } catch {}
}

export interface CelebrationOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number }; // 0 to 1 relative coordinates, or pixels
  colors?: string[];
  ticks?: number;
}

const FESTIVE_EMOJIS = ['✨', '⭐', '💎', '👑', '🎉', '🌟'];
const FESTIVE_COLORS = [
  '#f59e0b', // Gold
  '#fbbf24', // Amber
  '#10b981', // Emerald
  '#8b5cf6', // Amethyst Violet
  '#ec4899', // Ruby Pink
  '#06b6d4', // Cyan Sparkle
  '#ffffff', // Diamond White
];

// Ensure keyframe styles are injected into document head once
let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleId = 'cuizin-celebration-styles';
  if (document.getElementById(styleId)) {
    stylesInjected = true;
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes cuizinAuraRipple {
      0% {
        transform: translate3d(-50%, -50%, 0) scale(0.2);
        opacity: 0.85;
      }
      100% {
        transform: translate3d(-50%, -50%, 0) scale(2.8);
        opacity: 0;
      }
    }

    @keyframes cuizinParticleFly {
      0% {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(0.3) rotate(0deg);
      }
      20% {
        opacity: 1;
        transform: translate3d(calc(var(--tx) * 0.35), calc(var(--ty) * 0.35), 0) scale(1.15) rotate(calc(var(--rot) * 0.3));
      }
      75% {
        opacity: 0.95;
      }
      100% {
        opacity: 0;
        transform: translate3d(var(--tx), calc(var(--ty) + var(--gravity, 40px)), 0) scale(var(--end-scale, 0.4)) rotate(var(--rot));
      }
    }

    .cuizin-celebration-container {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 99999;
      overflow: hidden;
    }

    .cuizin-aura {
      position: absolute;
      border-radius: 9999px;
      pointer-events: none;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, rgba(251, 191, 36, 0.2) 40%, rgba(255, 255, 255, 0) 70%);
      animation: cuizinAuraRipple 0.65s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
      will-change: transform, opacity;
    }

    .cuizin-particle {
      position: absolute;
      pointer-events: none;
      will-change: transform, opacity;
      animation: cuizinParticleFly 0.95s cubic-bezier(0.15, 0.85, 0.35, 1) forwards;
      user-select: none;
    }
  `;
  document.head.appendChild(style);
  stylesInjected = true;
}

let lastTriggerTime = 0;

/**
 * Triggers a hardware-accelerated, zero-canvas celebration particle burst.
 */
export function safeCelebration(options?: CelebrationOptions) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Clean any stray canvas left by previous operations
  cleanupCelebrations();

  // If user or app disabled celebration, exit cleanly
  if (!isCelebrationEnabled()) {
    return;
  }

  // Throttle bursts that fire within 200ms of each other to keep 60fps silky smooth
  const now = Date.now();
  if (now - lastTriggerTime < 200) {
    return;
  }
  lastTriggerTime = now;

  ensureStyles();

  try {
    const container = document.createElement('div');
    container.className = 'cuizin-celebration-container';

    // Calculate origin in screen pixels
    const winW = window.innerWidth || 360;
    const winH = window.innerHeight || 640;

    let originX = winW * 0.5;
    let originY = winH * 0.55;

    if (options?.origin) {
      if (typeof options.origin.x === 'number') {
        originX = options.origin.x <= 1 ? options.origin.x * winW : options.origin.x;
      }
      if (typeof options.origin.y === 'number') {
        originY = options.origin.y <= 1 ? options.origin.y * winH : options.origin.y;
      }
    }

    // 1. Golden Aura Ripple at epicenter
    const aura = document.createElement('div');
    aura.className = 'cuizin-aura';
    const auraSize = 140;
    aura.style.left = `${originX}px`;
    aura.style.top = `${originY}px`;
    aura.style.width = `${auraSize}px`;
    aura.style.height = `${auraSize}px`;
    container.appendChild(aura);

    // 2. Confetti & Sparkle Particles (24 to 32 particles for optimal impact without lag)
    const count = Math.min(Math.max(options?.particleCount ?? 26, 16), 40);

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'cuizin-particle';
      particle.style.left = `${originX}px`;
      particle.style.top = `${originY}px`;

      // 35% chance of emoji sparkle / gem, 65% colorful confetti geometric shard
      const isEmoji = Math.random() < 0.35;

      if (isEmoji) {
        particle.textContent = FESTIVE_EMOJIS[Math.floor(Math.random() * FESTIVE_EMOJIS.length)];
        particle.style.fontSize = `${14 + Math.floor(Math.random() * 10)}px`;
        particle.style.lineHeight = '1';
      } else {
        const color = FESTIVE_COLORS[Math.floor(Math.random() * FESTIVE_COLORS.length)];
        const shape = Math.random();
        const sizeW = 7 + Math.floor(Math.random() * 7);
        const sizeH = shape > 0.5 ? sizeW : sizeW * 1.6;

        particle.style.width = `${sizeW}px`;
        particle.style.height = `${sizeH}px`;
        particle.style.backgroundColor = color;
        particle.style.borderRadius = shape > 0.7 ? '9999px' : shape > 0.4 ? '2px' : '0px';
        particle.style.boxShadow = `0 0 6px ${color}88`;
      }

      // Physics vector: angle, distance, gravity, rotation
      // Bias trajectory slightly upwards (-160deg to -20deg) for a fountain burst effect
      const angle = (Math.random() * 360) * (Math.PI / 180);
      const distance = 80 + Math.random() * 180;
      const tx = Math.cos(angle) * distance;
      // bias Y upwards
      const ty = Math.sin(angle) * distance * 0.85 - (Math.random() * 40);
      const gravity = 30 + Math.random() * 50;
      const rot = (Math.random() - 0.5) * 720;
      const endScale = 0.2 + Math.random() * 0.4;
      const delay = Math.random() * 0.08;

      particle.style.setProperty('--tx', `${tx.toFixed(1)}px`);
      particle.style.setProperty('--ty', `${ty.toFixed(1)}px`);
      particle.style.setProperty('--gravity', `${gravity.toFixed(1)}px`);
      particle.style.setProperty('--rot', `${rot.toFixed(0)}deg`);
      particle.style.setProperty('--end-scale', `${endScale.toFixed(2)}`);
      particle.style.animationDelay = `${delay.toFixed(3)}s`;

      container.appendChild(particle);
    }

    document.body.appendChild(container);

    // Guaranteed self-cleanup after animation completes
    window.setTimeout(() => {
      try {
        container.remove();
      } catch {}
    }, 1100);
  } catch (err) {
    console.warn('[Celebration] Error rendering DOM celebration:', err);
  }
}

/**
 * Drop-in replacement for canvas-confetti's `confetti(...)` export.
 */
export const confetti = (options?: CelebrationOptions) => {
  safeCelebration(options);
};

// Global debug helpers for testing in devtools/console
if (typeof window !== 'undefined') {
  (window as any).__setCelebrationMode = setCelebrationMode;
  (window as any).__getCelebrationMode = getCelebrationMode;
  (window as any).__safeCelebration = safeCelebration;
  (window as any).__cleanupCelebrations = cleanupCelebrations;
}

export default safeCelebration;
