import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mascot } from '@/mobile/components/Mascot';

export function ImageGame() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center text-center pt-6">
      <Mascot mood="happy" size={100} className="mb-4" />
      <h2 className="text-xl font-bold mb-2">Image Trivia</h2>
      <p className="text-muted-foreground max-w-xs mb-6">Image questions are included in the regular quiz feed. Jump in to start guessing!</p>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/quiz')}
        className="rounded-2xl px-8 py-3.5 font-bold text-primary-foreground bg-gradient-to-r from-violet-500 to-fuchsia-600 shadow-lg"
      >Play quiz</motion.button>
    </div>
  );
}