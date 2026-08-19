import { useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Max tilt angle in degrees. Default 8. */
  maxTilt?: number;
  /** Scale on hover/press. Default 1.02. */
  hoverScale?: number;
  /** Glare overlay intensity 0–1. Default 0.25. */
  glareIntensity?: number;
  onClick?: () => void;
  onTap?: () => void;
  id?: string;
}

/**
 * TiltCard — holographic 3D tilt effect for premium card feel.
 *
 * On mobile:  reacts to DeviceOrientation (gyroscope) if permission is granted,
 *             with graceful fallback to touch-position tracking.
 * On desktop: reacts to mouse-position within the card bounds.
 *
 * Respects `prefers-reduced-motion` — disables tilt when set.
 */
export function TiltCard({
  children,
  className,
  style,
  maxTilt       = 8,
  hoverScale    = 1.02,
  glareIntensity = 0.25,
  onClick,
  onTap,
  id,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Respect prefers-reduced-motion
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Spring-smoothed tilt values
  const rotateX = useSpring(useTransform(rawY, [-1, 1], [ maxTilt, -maxTilt]), { stiffness: 280, damping: 30 });
  const rotateY = useSpring(useTransform(rawX, [-1, 1], [-maxTilt,  maxTilt]), { stiffness: 280, damping: 30 });

  // Glare gradient position (moves opposite to tilt)
  const glareX = useTransform(rawX, [-1, 1], ['120%', '-20%']);
  const glareY = useTransform(rawY, [-1, 1], ['120%', '-20%']);

  // ── Touch / Mouse handler ────────────────────────────────────────────────
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2; // –1 … 1
    const ny = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    rawX.set(nx);
    rawY.set(ny);
  }, [reducedMotion, rawX, rawY]);

  const resetTilt = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  // ── DeviceOrientation (gyro on mobile) ───────────────────────────────────
  useEffect(() => {
    if (reducedMotion) return;

    const handler = (e: DeviceOrientationEvent) => {
      // beta  = front/back tilt  (−180 … 180)
      // gamma = left/right tilt  (−90  … 90)
      const beta  = e.beta  ?? 0;
      const gamma = e.gamma ?? 0;
      // Normalise to −1 … 1 with gentle range
      rawY.set(Math.max(-1, Math.min(1, (beta  - 45) / 20)));
      rawX.set(Math.max(-1, Math.min(1,  gamma        / 20)));
    };

    // iOS 13+ requires permission — try without it first (Android/desktop)
    if (typeof DeviceOrientationEvent !== 'undefined') {
      const doi = DeviceOrientationEvent as any;
      if (typeof doi.requestPermission === 'function') {
        // Permission-gated (iOS): silently skip gyro, touch-fallback handles it
        return;
      }
      window.addEventListener('deviceorientation', handler, { passive: true });
      return () => window.removeEventListener('deviceorientation', handler);
    }
  }, [reducedMotion, rawX, rawY]);

  if (reducedMotion) {
    // Render plain div — zero animation overhead
    return (
      <div ref={ref} className={className} style={style} onClick={onClick} id={id}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      id={id}
      className={className}
      style={{
        ...style,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 800,
      }}
      whileTap={{ scale: 0.97, z: -4 }}
      whileHover={{ scale: hoverScale }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      onClick={onClick}
    >
      {/* Inner — pushed toward viewer */}
      <div style={{ transform: 'translateZ(4px)' }}>
        {children}
      </div>

      {/* Glare overlay — mimics holographic foil */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,${glareIntensity}) 0%, transparent 60%)`,
          mixBlendMode: 'overlay',
          zIndex: 10,
        }}
      />
    </motion.div>
  );
}

export default TiltCard;
