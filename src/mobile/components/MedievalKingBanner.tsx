import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MedievalKingBannerProps {
  compact?: boolean;
  className?: string;
}

export function MedievalKingBanner({ compact = false, className }: MedievalKingBannerProps) {
  return (
    <div className={cn("relative select-none overflow-hidden", className)}>
      {/* Stone archway background */}
      <div className="absolute inset-0 castle-archway opacity-30 pointer-events-none" />

      {/* Torch left */}
      <div className="absolute left-3 top-4 flex flex-col items-center">
        <div className="torch-glow" style={{ animationDelay: '0s' }} />
        <div className="w-1.5 h-8 bg-gradient-to-b from-amber-800 to-amber-950 rounded-b-sm mt-0.5" />
        <div className="torch-glow-ambient -mt-12 -ml-4" />
      </div>

      {/* Torch right */}
      <div className="absolute right-3 top-4 flex flex-col items-center">
        <div className="torch-glow" style={{ animationDelay: '0.8s' }} />
        <div className="w-1.5 h-8 bg-gradient-to-b from-amber-800 to-amber-950 rounded-b-sm mt-0.5" />
        <div className="torch-glow-ambient -mt-12 -mr-4" />
      </div>

      {/* Character assembly */}
      <div className={cn(
        "relative flex items-end justify-center",
        compact ? "h-36 pt-6 pb-2" : "h-48 pt-8 pb-3"
      )}>
        {/* Outer left: Socrates */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 0.7, x: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute left-[calc(50%-105px)] bottom-3 -translate-x-1/2 z-0 text-center"
        >
          <div className="rounded-xl overflow-hidden border-2 border-cyan-500/40 shadow-md w-14 h-14">
            <img src="/medieval/socrates.png" alt="Socrates" className="w-full h-full object-cover scale-110" loading="lazy" />
          </div>
          <p className="text-[9px] text-cyan-300 font-extrabold tracking-wider mt-1 uppercase">Socrates</p>
        </motion.div>

        {/* Inner left: Aryabhata */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 0.85, x: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute left-[calc(50%-55px)] bottom-4 -translate-x-1/2 z-10 text-center"
        >
          <div className="rounded-xl overflow-hidden border-2 border-amber-500/40 shadow-md w-16 h-16">
            <img src="/medieval/aryabhata.png" alt="Aryabhata" className="w-full h-full object-cover scale-110" loading="lazy" />
          </div>
          <p className="text-[9px] text-amber-300 font-extrabold tracking-wider mt-1 uppercase">Aryabhata</p>
        </motion.div>

        {/* THE KING — center */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="relative z-20 text-center"
        >
          {/* King glow */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-t from-amber-500/10 to-yellow-400/20 blur-xl pointer-events-none" />
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-[3px] border-yellow-500/60 w-24 h-24">
            <img src="/medieval/king.png" alt="The King" className="w-full h-full object-cover" loading="lazy" />
            {/* Crown shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
            />
          </div>
          <p className="text-[11px] font-black font-serif tracking-[0.2em] mt-1.5 uppercase text-yellow-400">
            The King
          </p>
          {/* Floating crown */}
          <motion.span
            className="absolute left-1/2 -translate-x-1/2 select-none -top-6 text-3xl"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            👑
          </motion.span>
        </motion.div>

        {/* Inner right: Chanakya */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 0.85, x: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute left-[calc(50%+55px)] bottom-4 -translate-x-1/2 z-10 text-center"
        >
          <div className="rounded-xl overflow-hidden border-2 border-rose-500/40 shadow-md w-16 h-16">
            <img src="/medieval/chanakya.png" alt="Chanakya" className="w-full h-full object-cover scale-110" loading="lazy" />
          </div>
          <p className="text-[9px] text-rose-300 font-extrabold tracking-wider mt-1 uppercase">Chanakya</p>
        </motion.div>

        {/* Outer right: Ramanujan */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 0.7, x: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute left-[calc(50%+105px)] bottom-3 -translate-x-1/2 z-0 text-center"
        >
          <div className="rounded-xl overflow-hidden border-2 border-purple-500/40 shadow-md w-14 h-14">
            <img src="/medieval/ramanujan.png" alt="Ramanujan" className="w-full h-full object-cover scale-110" loading="lazy" />
          </div>
          <p className="text-[9px] text-purple-300 font-extrabold tracking-wider mt-1 uppercase">Ramanujan</p>
        </motion.div>
      </div>

      {/* Heraldic banner strips */}
      <div className="flex justify-center gap-4 mt-1">
        {['bg-red-800', 'bg-yellow-600', 'bg-red-800'].map((color, i) => (
          <motion.div
            key={i}
            className={cn("w-4 h-8 rounded-b-sm animate-wind", color)}
            style={{ animationDelay: `${i * 0.4}s`, opacity: 0.5 }}
          />
        ))}
      </div>
    </div>
  );
}
