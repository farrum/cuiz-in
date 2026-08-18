import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
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

        // Fetch all roles (a user can hold several) and pick the highest
        const { data: roleRows } = await supabase
          .from('user_roles' as any)
          .select('role')
          .eq('user_id', storedUserId);

        const roles = ((roleRows as any[]) || []).map((r) => String(r.role).toLowerCase());
        const priority = ['admin', 'king', 'baron', 'team_leader', 'knight', 'officer', 'junior_team_leader'];
        const userRole = priority.find((p) => roles.includes(p)) || 'infantry';
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
      case 'team_leader':
        return 'Baron';
      case 'knight':
        return 'Knight';
      case 'officer':
      case 'junior_team_leader':
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
      case 'team_leader':
        return '/medieval/baron.png';
      case 'knight':
        return '/medieval/knight.png';
      case 'officer':
      case 'junior_team_leader':
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
        return 'text-amber-200 border-amber-500/60';
      case 'baron':
      case 'team_leader':
        return 'text-amber-100 border-amber-500/60';
      case 'knight':
        return 'text-blue-200 border-blue-400/60';
      case 'officer':
      case 'junior_team_leader':
        return 'text-emerald-200 border-emerald-400/60';
      case 'infantry':
      default:
        return 'text-slate-100 border-slate-400/60';
    }
  };

  const getRankGlowStyle = (r: string): React.CSSProperties => {
    switch (r.toLowerCase()) {
      case 'admin':
      case 'king':
        return { borderColor: 'hsl(45 95% 55%)', boxShadow: '0 0 0 3px hsl(45 95% 55% / 0.25), 0 0 20px hsl(45 90% 60% / 0.3)' };
      case 'baron':
      case 'team_leader':
        return { borderColor: 'hsl(38 85% 55%)', boxShadow: '0 0 0 3px hsl(38 85% 55% / 0.22), 0 0 16px hsl(38 80% 60% / 0.25)' };
      case 'knight':
        return { borderColor: 'hsl(210 80% 55%)', boxShadow: '0 0 0 3px hsl(210 80% 55% / 0.22), 0 0 16px hsl(210 75% 60% / 0.25)' };
      case 'officer':
      case 'junior_team_leader':
        return { borderColor: 'hsl(145 60% 45%)', boxShadow: '0 0 0 3px hsl(145 60% 45% / 0.22), 0 0 14px hsl(145 55% 50% / 0.22)' };
      default:
        return { borderColor: 'hsl(220 20% 70%)', boxShadow: '0 0 0 2px hsl(220 20% 70% / 0.15)' };
    }
  };

  return (
    <div
      className={cn("relative select-none overflow-hidden rounded-3xl border-2 bg-slate-900 shadow-md", className)}
      style={getRankGlowStyle(role)}
    >
      {/* Full-bleed rank artwork */}
      <div className={cn("relative w-full", compact ? "h-36" : "h-48")}>
        <img
          src={getRankImage(role)}
          alt={getRankName(role)}
          className="absolute inset-0 w-full h-full object-cover object-top scale-105"
          loading="lazy"
        />
        {/* Darkening overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-slate-950/25" />
        {/* Shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent"
          animate={{ x: ['-100%', '220%'] }}
          transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
        />
        {/* Rank badge pip — bottom-left corner */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
          className={cn(
            'absolute bottom-2 left-3 text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border backdrop-blur-sm',
            getRankColorClass(role)
          )}
          style={{ background: 'rgba(15,20,30,0.65)' }}
        >
          {getRankName(role)}
        </motion.div>
        {/* Name */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "absolute bottom-3 inset-x-0 text-center text-xs font-black font-serif tracking-[0.2em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]",
            getRankColorClass(role).split(' ')[0]
          )}
        >
          {getRankName(role)} {username}
        </motion.p>
      </div>

      {/* Hierarchy Path Breadcrumb */}
      {!loading && hierarchyPath.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1 my-2 px-4 py-1.5 bg-slate-900/70 border border-slate-700 rounded-xl mx-4 max-w-lg md:mx-auto">
          <div className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-300 tracking-widest mr-1">
            <Shield className="w-3 h-3 text-amber-300" /> Hierarchy:
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
                      ? "bg-amber-400/20 text-amber-200 border border-amber-400/50" 
                      : "text-slate-300"
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
