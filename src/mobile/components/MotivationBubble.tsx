import { AnimatePresence, motion } from 'framer-motion';

export function MotivationBubble({ message, emoji }: { message: string; emoji?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          className="relative max-w-xs rounded-2xl bg-card border border-border shadow-xl px-4 py-2.5 text-sm font-medium"
        >
          <span className="mr-1.5" aria-hidden>{emoji || '✨'}</span>
          {message}
          <span className="absolute -bottom-2 left-6 w-4 h-4 rotate-45 bg-card border-r border-b border-border" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MotivationBubble;