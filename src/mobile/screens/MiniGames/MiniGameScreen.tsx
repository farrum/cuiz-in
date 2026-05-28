import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Mascot } from '@/mobile/components/Mascot';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { WheelGame } from './games/WheelGame';
import { ScratchGame } from './games/ScratchGame';
import { TrueFalseGame } from './games/TrueFalseGame';
import { ImageGame } from './games/ImageGame';

const TITLES: Record<string, { title: string; color: string }> = {
  wheel: { title: 'Spin the Wheel', color: 'from-emerald-400 to-teal-600' },
  scratch: { title: 'Scratch Card', color: 'from-amber-400 to-orange-600' },
  'true-false': { title: 'True or False', color: 'from-sky-400 to-blue-600' },
  image: { title: 'Image Trivia', color: 'from-violet-500 to-fuchsia-600' },
};

export default function MiniGameScreen() {
  const { gameId = '' } = useParams();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const meta = TITLES[gameId];

  let body: React.ReactNode = (
    <div className="text-center">
      <Mascot mood="thinking" size={100} className="mx-auto mb-4" />
      <p className="text-muted-foreground">This mini-game is coming soon.</p>
    </div>
  );
  if (gameId === 'wheel') body = <WheelGame />;
  else if (gameId === 'scratch') body = <ScratchGame />;
  else if (gameId === 'true-false') body = <TrueFalseGame />;
  else if (gameId === 'image') body = <ImageGame />;

  return (
    <div className={`fixed inset-0 flex flex-col bg-gradient-to-br from-background via-background to-primary/10`}>
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
      >
        <button onClick={() => { haptics('light'); navigate('/hub'); }} className="p-2 -ml-2 rounded-full hover:bg-muted" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
        <h1 className={`font-bold bg-gradient-to-r ${meta?.color ?? 'from-primary to-purple-500'} bg-clip-text text-transparent`}>
          {meta?.title || 'Mini-game'}
        </h1>
        <div className="w-9" />
      </div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex-1 overflow-y-auto p-4">
        {body}
      </motion.div>
    </div>
  );
}