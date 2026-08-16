import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Info } from 'lucide-react';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import {
  ARMORY_ITEMS,
  getUserBalances,
  purchaseItem,
  getPurchasedItems,
  getEquippedItems,
  getEquippedTitle,
  equipItem,
  unequipItem,
  equipTitle,
  unequipTitle
} from '@/utils/shopData';
import { MascotPlayer } from '@/mobile/mascots/MascotPlayer';

export default function ShopScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  
  const [profile, setProfile] = useState<{ gems: number; stars: number }>({ gems: 0, stars: 0 });
  const [purchased, setPurchased] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<Record<string, string>>({});
  const [equippedTitleId, setEquippedTitleId] = useState('');
  const [shopTrigger, setShopTrigger] = useState(0);

  useEffect(() => {
    const { gems, stars } = getUserBalances();
    setProfile({ gems, stars });
    setPurchased(getPurchasedItems());
    setEquipped(getEquippedItems());
    setEquippedTitleId(getEquippedTitle());
  }, [shopTrigger]);

  const reloadGems = () => {
    const { gems, stars } = getUserBalances();
    setProfile({ gems, stars });
  };

  const getReasoning = (type: string) => {
    switch(type) {
      case 'weapon': return "Boosts your star earnings automatically during quizzes when equipped.";
      case 'shield': return "Equip this to automatically block wrong answers during your daily challenges.";
      case 'avatar_frame': return "Equip this frame to make your profile picture stand out in the leaderboards and kingdom hall.";
      case 'backdrop': return "Changes the background of your profile page so everyone sees your royal status.";
      case 'counselor_shard': return "Collect 5 shards to unlock historical advisors who grant you lifelines during tough quiz battles.";
      case 'potion': return "Use during any quiz battle to gain a magical advantage when you're stuck.";
      case 'prestige_title': return "Equip this title to show off your rank next to your name everywhere in the game.";
      default: return "Enhances your royal gameplay experience.";
    }
  };

  return (
    <div className="min-h-full bg-background flex flex-col relative pb-[120px]">
      {/* Header */}
      <div 
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b-2 border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm"
        style={{ transform: 'translate3d(0, 0, 0)', willChange: 'transform' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => { haptics('light'); navigate(-1); }} className="p-2 -ml-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-xl font-black text-amber-900 tracking-wide">Royal Shop</h1>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-blue-50 border-2 border-blue-100 rounded-xl px-3 py-1 flex items-center gap-1.5 shadow-inner">
             <span className="text-sm drop-shadow-sm">💎</span>
             <span className="text-sm font-black text-blue-600">{profile.gems}</span>
           </div>
           <div className="bg-amber-50 border-2 border-amber-100 rounded-xl px-3 py-1 flex items-center gap-1.5 shadow-inner">
             <span className="text-sm drop-shadow-sm">⭐</span>
             <span className="text-sm font-black text-amber-500">{profile.stars}</span>
           </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        <div className="panel-3d bg-white p-5 flex items-center gap-4">
          <MascotPlayer character="king" mood="excited" size={80} noHalo />
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">The Royal Armory</h2>
            <p className="text-[12px] font-bold text-slate-500 leading-snug">
              Spend your gems and stars to acquire enhancements, lifelines, and exclusive profile cosmetics!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {ARMORY_ITEMS.map((item) => {
            const isShard = item.type === 'counselor_shard';
            const owned = purchased.includes(item.id);
            const isEquipped = equipped[item.type] === item.id || (item.type === 'prestige_title' && equippedTitleId === item.id);
            
            return (
              <div key={item.id} className="panel-3d bg-white p-5 flex flex-col relative overflow-hidden group">
                {isEquipped && (
                   <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-bl-xl shadow-sm border-b-2 border-l-2 border-amber-500 z-10">
                     Active
                   </div>
                )}
                
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-4xl shadow-inner shrink-0">
                    <span className="drop-shadow-sm">{item.emoji}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-black text-slate-800 text-lg leading-tight mb-1 truncate">{item.name}</h3>
                    <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-1 rounded border border-amber-300 shadow-sm self-start inline-block">
                      {item.effect}
                    </span>
                  </div>
                </div>

                <div className="mt-4 bg-slate-50 rounded-xl p-3 border-2 border-slate-100 shadow-inner">
                  <p className="text-xs font-bold text-slate-600 mb-2">{item.description}</p>
                  <div className="flex items-start gap-2 pt-2 border-t-2 border-slate-200">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-black text-blue-600/80 leading-snug">
                      {getReasoning(item.type)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t-2 border-slate-100">
                  {owned && !isShard ? (
                    isEquipped ? (
                      <motion.button 
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          haptics('light');
                          if (item.type === 'prestige_title') unequipTitle();
                          else unequipItem(item.type);
                          setShopTrigger(p => p + 1);
                        }}
                        className="w-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-black px-3 py-3 rounded-xl text-xs uppercase tracking-wider shadow-inner"
                      >
                        Unequip Item
                      </motion.button>
                    ) : (
                      <motion.button 
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          haptics('light');
                          if (item.type === 'prestige_title') equipTitle(item.id);
                          else equipItem(item.id);
                          setShopTrigger(p => p + 1);
                        }}
                        className="w-full btn-3d btn-3d-primary py-3 rounded-xl text-xs uppercase tracking-wider"
                      >
                        Equip Item
                      </motion.button>
                    )
                  ) : (
                    <motion.button 
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        haptics('success');
                        const res = purchaseItem(item.id);
                        if (res.success) {
                          alert(res.message);
                          reloadGems();
                        } else {
                          alert(res.message);
                        }
                        setShopTrigger(p => p + 1);
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 px-3 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      Buy for 
                      {item.costGems > 0 && <span className="text-blue-400">💎 {item.costGems}</span>}
                      {item.costStars > 0 && <span className="text-amber-400">⭐ {item.costStars}</span>}
                    </motion.button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
