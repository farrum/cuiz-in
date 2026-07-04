import { motion } from 'framer-motion';
import { TorchSparks } from '@/mobile/components/TorchSparks';

export function MobileSplash() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center stone-wall">
      {/* Torch glow left */}
      <div className="absolute left-6 top-1/3 flex flex-col items-center">
        <div className="relative">
          <div className="torch-glow" />
          <TorchSparks count={4} />
        </div>
        <div className="w-1.5 h-10 bg-gradient-to-b from-amber-800 to-amber-950 rounded-b-sm mt-0.5" />
        <div className="torch-glow-ambient -mt-14" />
      </div>

      {/* Torch glow right */}
      <div className="absolute right-6 top-1/3 flex flex-col items-center">
        <div className="relative">
          <div className="torch-glow" style={{ animationDelay: '0.7s' }} />
          <TorchSparks count={4} />
        </div>
        <div className="w-1.5 h-10 bg-gradient-to-b from-amber-800 to-amber-950 rounded-b-sm mt-0.5" />
        <div className="torch-glow-ambient -mt-14" style={{ animationDelay: '0.7s' }} />
      </div>

      {/* Castle arch behind logo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-52 h-28 castle-archway opacity-40" />

      {/* Logo with golden glow */}
      <motion.div
        aria-hidden
        className="absolute w-48 h-48 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.15) 0%, transparent 70%)' }}
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

      {/* Iron chain loading indicator */}
      <motion.div
        className="relative mt-8 flex gap-2"
        aria-hidden
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: 'radial-gradient(circle at 35% 35%, hsl(35 20% 50%), hsl(35 15% 25%))',
              boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.5)',
            }}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>

      {/* Medieval tagline */}
      <motion.p
        className="mt-6 text-[10px] font-serif text-amber-600/60 tracking-[0.3em] uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Enter the Kingdom
      </motion.p>
    </div>
  );
}

export default MobileSplash;