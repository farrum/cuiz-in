import { motion } from 'framer-motion';

export function MobileSplash() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/15 via-background to-purple-500/10">
      {/* glow pulse behind logo */}
      <motion.div
        aria-hidden
        className="absolute w-48 h-48 rounded-full bg-primary/30 blur-3xl"
        animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.img
        src="/cuizin-logo.png"
        alt="CuizIN"
        className="relative w-40 h-auto drop-shadow-xl"
        initial={{ scale: 0.6, opacity: 0, y: 8 }}
        animate={{ scale: [0.9, 1.04, 0.97, 1], opacity: 1, y: 0 }}
        transition={{ duration: 1.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      />
      <motion.div
        className="relative mt-6 flex gap-1.5"
        aria-hidden
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>
    </div>
  );
}

export default MobileSplash;