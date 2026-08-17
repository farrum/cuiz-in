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
    <div className="relative min-h-full">

      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(160deg, hsl(38 60% 93%) 0%, hsl(220 40% 92%) 100%)' }} />
      {/* Sticky header */}
      <div
        className="sticky top-0 z-30 backdrop-blur-md border-b border-amber-200/60 px-4 py-2.5"
        style={{ background: 'hsl(38 60% 95% / 0.92)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { haptics('light'); navigate(-1); }}
              className="p-2 -ml-2 rounded-xl hover:bg-amber-100/60 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-amber-900/70" />
            </button>
            <h1 className="text-[19px] font-black tracking-tight" style={{ color: 'hsl(30 60% 18%)' }}>Royal Armory</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100 border border-sky-200">
              <span className="text-sm">💎</span>
              <span className="text-sm font-black text-sky-700">{profile.gems}</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-200">
              <span className="text-sm">⭐</span>
              <span className="text-sm font-black text-amber-700">{profile.stars}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="relative px-4 pt-5 pb-6 space-y-5">

        {/* Hero intro card */}
        <div className="flex items-center gap-3 rounded-2xl bg-white/80 ring-1 ring-black/[0.06] px-4 py-3.5 shadow-sm">
          <MascotPlayer character="king" mood="excited" size={64} noHalo />
          <div>
            <h2 className="font-black text-[14px] tracking-tight" style={{ color: 'hsl(30 60% 18%)' }}>Royal Armory</h2>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-snug max-w-[220px]">
              Spend gems &amp; stars to acquire enhancements, lifelines &amp; exclusive cosmetics!
            </p>
          </div>
        </div>

        {/* Items grid */}
        <div className="space-y-3">
          {ARMORY_ITEMS.map((item) => {
            const isShard = item.type === 'counselor_shard';
            const owned = purchased.includes(item.id);
            const isEquipped = equipped[item.type] === item.id || (item.type === 'prestige_title' && equippedTitleId === item.id);

            return (
              <div key={item.id} className="relative rounded-2xl bg-white/85 ring-1 ring-black/[0.06] shadow-sm p-4 overflow-hidden">

                {/* Equipped ribbon */}
                {isEquipped && (
                  <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-bl-2xl rounded-tr-2xl z-10">
                    Equipped
                  </div>
                )}

                {/* Item header row */}
                <div className="flex gap-3 mb-3">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                    style={{ background: 'linear-gradient(135deg, hsl(45 80% 85%), hsl(38 60% 80%))' }}>
                    <span className="drop-shadow-sm">{item.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-black text-[15px] leading-tight tracking-tight truncate" style={{ color: 'hsl(220 50% 15%)' }}>{item.name}</h3>
                    <span className="mt-1 self-start text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      {item.effect}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-2.5 mb-3">
                  <p className="text-[12px] font-medium text-slate-600 leading-snug mb-2">{item.description}</p>
                  <div className="flex items-start gap-1.5 pt-2 border-t border-slate-200">
                    <Info className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium text-sky-600/90 leading-snug">{getReasoning(item.type)}</p>
                  </div>
                </div>

                {/* Action button */}
                {owned && !isShard ? (
                  isEquipped ? (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { haptics('light'); if (item.type === 'prestige_title') unequipTitle(); else unequipItem(item.type); setShopTrigger(p => p + 1); }}
                      className="w-full rounded-xl py-3 text-[12px] font-black uppercase tracking-wide text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Unequip
                    </motion.button>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { haptics('light'); if (item.type === 'prestige_title') equipTitle(item.id); else equipItem(item.id); setShopTrigger(p => p + 1); }}
                      className="w-full rounded-xl py-3 text-[12px] font-black uppercase tracking-wide text-white"
                      style={{ background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 45%))', boxShadow: '0 3px 0 hsl(30 80% 35%)' }}
                    >
                      ⚔️ Equip Item
                    </motion.button>
                  )
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { haptics('success'); const res = purchaseItem(item.id); alert(res.message); reloadGems(); setShopTrigger(p => p + 1); }}
                    className="w-full rounded-xl py-3 text-[12px] font-black uppercase tracking-wide text-white flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(160deg, hsl(220 60% 40%), hsl(220 70% 30%))', boxShadow: '0 3px 0 hsl(220 70% 20%)' }}
                  >
                    Buy for
                    {item.costGems  > 0 && <span className="text-sky-300">💎 {item.costGems}</span>}
                    {item.costStars > 0 && <span className="text-amber-300">⭐ {item.costStars}</span>}
                  </motion.button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
