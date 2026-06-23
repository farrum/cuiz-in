import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mascot } from '@/mobile/components/Mascot';
import { Sparkles, Eye, Trophy, Image as ImageIcon } from 'lucide-react';

export function ImageGame() {
  const navigate = useNavigate();

  const features = [
    { icon: Eye, label: 'Scratch & Guess' },
    { icon: Trophy, label: 'Earn Double Gems' },
    { icon: Sparkles, label: 'Visual Puzzles' },
  ];

  return (
    <div className="flex flex-col items-center justify-between text-center py-6 w-full max-w-sm mx-auto min-h-[380px]">
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {/* Animated Mascot / Badge Container */}
        <div className="relative">
          <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3">
            <ImageIcon className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Text Headers */}
        <div>
          <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-violet-500 to-fuchsia-600 text-transparent bg-clip-text">
            Image Trivia
          </h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-[280px] leading-relaxed mx-auto">
            Test your visual knowledge and guess hidden images to score bonus gems!
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-2 max-w-[300px]">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div 
                key={i} 
                className="flex items-center gap-1 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full text-xs font-bold text-violet-600"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{f.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="w-full px-4 mt-8">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/quiz?type=image')}
          className="w-full rounded-2xl py-4 font-black text-white text-base bg-gradient-to-r from-violet-500 to-fuchsia-600 shadow-[0_6px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_8px_24px_rgba(139,92,246,0.4)] active:scale-[0.98] transition-all"
        >
          Play Image Quiz
        </motion.button>
      </div>
    </div>
  );
}