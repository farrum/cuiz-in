import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BurningTorch } from '@/components/gamification/BurningTorch';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { Shield, ChevronRight, Crown } from 'lucide-react';

interface MedievalCharacterBannerProps {
  compact?: boolean;
  className?: string;
}

interface PathNode {
  level_index: number;
  user_id: string;
  username: string;
  role: string;
}

export function MedievalCharacterBanner({ compact = false, className }: MedievalCharacterBannerProps) {
  const [role, setRole] = useState<string>('infantry');
  const [username, setUsername] = useState<string>('Infantry');
  const [hierarchyPath, setHierarchyPath] = useState<PathNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserDataAndPath = async () => {
      try {
        const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
        if (!storedUserId) return;

        // Fetch current role
        const { data: roleData } = await supabase
          .from('user_roles' as any)
          .select('role')
          .eq('user_id', storedUserId)
          .maybeSingle();

        const userRole = (roleData as any)?.role || 'infantry';
        setRole(userRole);

        // Fetch username
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', storedUserId)
          .maybeSingle();
        
        if (profileData?.username) {
          setUsername(profileData.username);
        }

        // Fetch hierarchy path
        const { data: pathData, error: pathError } = await supabase
          .rpc('get_user_hierarchy_path' as any, { p_user_id: storedUserId });

        if (!pathError && pathData) {
          setHierarchyPath(pathData);
        }
      } catch (err) {
        console.error('Error fetching character banner info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndPath();
  }, []);

  const getRankName = (r: string) => {
    switch (r.toLowerCase()) {
      case 'admin':
      case 'king':
        return 'King';
      case 'baron':
        return 'Baron';
      case 'knight':
        return 'Knight';
      case 'officer':
        return 'Officer';
      case 'infantry':
      default:
        return 'Infantry';
    }
  };

  const getRankImage = (r: string) => {
    switch (r.toLowerCase()) {
      case 'admin':
      case 'king':
        return '/medieval/king.png';
      case 'baron':
        return '/medieval/baron.png';
      case 'knight':
        return '/medieval/knight.png';
      case 'officer':
        return '/medieval/officer.png';
      case 'infantry':
      default:
        return '/medieval/infantry.png';
    }
  };

  const getRankColorClass = (r: string) => {
    switch (r.toLowerCase()) {
      case 'admin':
      case 'king':
        return 'text-amber-600 border-amber-500/60';
      case 'baron':
        return 'text-amber-700 border-amber-500/60';
      case 'knight':
        return 'text-blue-600 border-blue-500/60';
      case 'officer':
        return 'text-emerald-600 border-emerald-500/60';
      case 'infantry':
      default:
        return 'text-slate-600 border-slate-300';
    }
  };

  return (
    <div className={cn("relative select-none overflow-hidden pb-4 rounded-3xl border-2 border-primary/20 bg-gradient-to-b from-white to-[#eaf4ff] shadow-md", className)}>
      {/* Torch left */}
      <BurningTorch className="absolute left-3 top-2 scale-75" />

      {/* Torch right */}
      <BurningTorch className="absolute right-3 top-2 scale-75" />

      {/* Character assembly */}
      <div className={cn(
        "relative flex items-end justify-center",
        compact ? "h-36 pt-6 pb-2" : "h-48 pt-8 pb-3"
      )}>
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="relative z-20 text-center"
        >
          {/* Glow */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-t from-amber-500/10 to-yellow-400/20 blur-xl pointer-events-none" />
          <div className={cn("relative rounded-2xl overflow-hidden shadow-xl border-[3px] w-24 h-24 bg-slate-900", getRankColorClass(role))}>
            <img src={getRankImage(role)} alt={getRankName(role)} className="w-full h-full object-cover" loading="lazy" />
            {/* Shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
            />
          </div>
          <p className={cn("text-[11px] font-black font-serif tracking-[0.2em] mt-1.5 uppercase", getRankColorClass(role))}>
            {getRankName(role)} {username}
          </p>
          {/* Rank icon */}
          {role === 'admin' || role === 'king' ? (
            <motion.span
              className="absolute left-1/2 -translate-x-1/2 select-none -top-6 text-3xl"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              👑
            </motion.span>
          ) : (
            <motion.span
              className="absolute left-1/2 -translate-x-1/2 select-none -top-6 text-xl"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              🛡️
            </motion.span>
          )}
        </motion.div>
      </div>

      {/* Hierarchy Path Breadcrumb */}
      {!loading && hierarchyPath.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1 mt-2 px-4 py-1.5 bg-white/80 border border-slate-200 rounded-xl mx-6 max-w-lg md:mx-auto">
          <div className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-600 tracking-widest mr-1">
            <Shield className="w-3 h-3 text-amber-600" /> Hierarchy:
          </div>
          {hierarchyPath.map((node, index) => {
            const isSelf = index === hierarchyPath.length - 1;
            const displayRank = getRankName(node.role);
            return (
              <div key={node.user_id} className="flex items-center gap-0.5">
                {index > 0 && <ChevronRight className="w-2.5 h-2.5 text-slate-400" />}
                <span 
                  className={cn(
                    "text-[10px] font-bold font-serif px-1.5 py-0.5 rounded",
                    isSelf 
                      ? "bg-amber-100 text-amber-700 border border-amber-300" 
                      : "text-slate-500"
                  )}
                >
                  {node.role === 'admin' || node.role === 'king' ? (
                    <Crown className="w-2.5 h-2.5 inline mr-0.5 text-yellow-500" />
                  ) : null}
                  {displayRank} ({node.username})
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
