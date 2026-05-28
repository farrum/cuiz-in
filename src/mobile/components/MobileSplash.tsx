import { motion } from 'framer-motion';

export function MobileSplash() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/15 via-background to-purple-500/10">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.9, 1.05, 0.95, 1], opacity: 1 }}
        transition={{ duration: 1.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        className="text-7xl"
        aria-hidden
      >
        💎
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-lg font-semibold tracking-wide bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent"
      >
        CuizIN
      </motion.p>
    </div>
  );
}

export default MobileSplash;