import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Shield, Sparkles, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';

export function PromotionAnimation() {
  const [show, setShow] = useState<boolean>(false);
  const [rankName, setRankName] = useState<string>('');
  const [currentRole, setCurrentRole] = useState<string>('');
  
  useEffect(() => {
    // Check for rank promotion by comparing current fetched role with stored role
    const checkPromotion = async () => {
      try {
        const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
        if (!storedUserId) return;

        // Fetch active user role
        const { data: roleData } = await supabase
          .from('user_roles' as any)
          .select('role')
          .eq('user_id', storedUserId)
          .maybeSingle();

        const activeRole = (roleData as any)?.role || 'infantry';
        const lastSeenRole = localStorage.getItem('last_seen_user_role') || 'infantry';
        const acknowledgedRole = localStorage.getItem('acknowledged_rank_role') || '';

        // Hierarchy hierarchy level check
        const levels: Record<string, number> = {
          'infantry': 1,
          'officer': 2,
          'knight': 3,
          'baron': 4,
          'king': 5,
          'admin': 5
        };

        const activeLevel = levels[activeRole] || 1;
        const lastSeenLevel = levels[lastSeenRole] || 1;

        // Save active role so we don't trigger repeatedly
        localStorage.setItem('last_seen_user_role', activeRole);
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, activeRole);

        // Only celebrate a genuine upgrade that hasn't already been acknowledged
        if (activeLevel > lastSeenLevel && acknowledgedRole !== activeRole) {
          setCurrentRole(activeRole);
          // Trigger promotion celebration!
          let name = 'Infantry';
          if (activeRole === 'officer') name = 'Officer';
          else if (activeRole === 'knight') name = 'Knight';
          else if (activeRole === 'baron') name = 'Baron';
          else if (activeRole === 'king' || activeRole === 'admin') name = 'King';

          setRankName(name);
          setShow(true);

          // Confetti explosion
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#d97706', '#fbbf24', '#ffffff', '#1e3a8a']
          });

          // Extra bursts
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 60,
              origin: { x: 0.3, y: 0.5 }
            });
            confetti({
              particleCount: 100,
              spread: 60,
              origin: { x: 0.7, y: 0.5 }
            });
          }, 400);
        }
      } catch (err) {
        console.error('Error checking promotion:', err);
      }
    };

    // Delay checking slightly to ensure login session is restored
    const timer = setTimeout(checkPromotion, 3000);
    
    // Also listen to custom event to manually trigger from dashboard promote
    const handleManualPromo = (e: Event) => {
      const customEvent = e as CustomEvent;
      setRankName(customEvent.detail?.rank || 'Officer');
      setShow(true);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
    };

    window.addEventListener('promotionTriggered' as any, handleManualPromo);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('promotionTriggered' as any, handleManualPromo);
    };
  }, []);

  const handleClose = () => {
    setShow(false);
    // Mark this rank as acknowledged so the celebration never shows again for it
    if (currentRole) {
      localStorage.setItem('acknowledged_rank_role', currentRole);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm select-none"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50, rotate: -2 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 15 }}
            className="parchment-card max-w-md w-full border-[6px] border-amber-700/80 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Castle style arch details inside */}
            <div className="absolute inset-0 castle-archway opacity-10 pointer-events-none" />

            <div className="flex justify-center gap-1.5 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
              <span className="text-[11px] font-black tracking-[0.3em] uppercase text-amber-900 font-serif">
                Glory to the Empire
              </span>
              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
            </div>

            <motion.h1 
              className="text-3xl font-black font-serif text-yellow-950 uppercase tracking-wide leading-tight mb-4 drop-shadow"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              🎉 Commissioned! 🎉
            </motion.h1>

            {/* Shield and Rank details */}
            <div className="relative w-32 h-32 mx-auto my-6 flex items-center justify-center bg-stone-900 rounded-full border-4 border-amber-600 shadow-inner">
              <Shield className="w-20 h-20 text-yellow-500" />
              <Award className="w-8 h-8 absolute text-stone-900 bottom-6" />
              <motion.div
                className="absolute inset-0 rounded-full border border-yellow-500/20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>

            <h2 className="text-xl font-black font-serif text-amber-950 uppercase tracking-widest mt-2">
              Rank Attained: <span className="underline decoration-yellow-600 text-2xl text-yellow-800">{rankName}</span>
            </h2>

            <p className="text-stone-850 text-xs font-semibold leading-relaxed mt-4 max-w-xs mx-auto">
              Your dedication to the realm has been recognized by the High Court! Raise your shield, gather your vassals, and conquer weekly charts.
            </p>

            <button
              onClick={handleClose}
              className="mt-8 w-full bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-black py-3 px-6 rounded-2xl text-sm uppercase tracking-widest border-2 border-yellow-500/40 shadow-lg transition-transform transform active:scale-95"
            >
              Claim Rank
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
