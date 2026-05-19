import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SkillTree, SkillNode } from './SkillTree';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SkillTreeContainerProps {
  userId: string;
}

export const SkillTreeContainer: React.FC<SkillTreeContainerProps> = ({ userId }) => {
  const [nodes, setNodes] = useState<SkillNode[]>([]);
  const [userGems, setUserGems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { toast } = useToast();

  const fetchSkillData = async () => {
    try {
      // 1. Fetch available nodes from gamification settings
      const { data: settingsData } = await (supabase as any)
        .from('gamification_settings')
        .select('config')
        .eq('setting_type', 'skill_nodes')
        .maybeSingle();
        
      // 2. Fetch user's unlocked skills
      const { data: unlockedData } = await (supabase as any)
        .from('user_skills')
        .select('skill_id')
        .eq('user_id', userId);
        
      // 3. Fetch user's gem balance
      const { data: profileData } = await (supabase as any)
        .from('profiles')
        .select('gems_balance')
        .eq('id', userId)
        .maybeSingle();

      setUserGems(profileData?.gems_balance || 0);

      const unlockedSet = new Set<string>((unlockedData || []).map((row: any) => row.skill_id));

      if (settingsData && settingsData.config) {
        const rawNodes: any[] = settingsData.config as any[];
        
        // Map raw config into SkillNode objects with state
        const mappedNodes: SkillNode[] = rawNodes.map(raw => {
          const isUnlocked = unlockedSet.has(raw.id);
          // It's purchasable if they don't own it AND they own all prerequisites
          const hasPrerequisites = (raw.prerequisites || []).every((prereq: string) => unlockedSet.has(prereq));
          
          return {
            id: raw.id,
            label: raw.name,
            description: raw.description,
            cost: raw.cost,
            icon: <span>{raw.icon === 'Clock' ? '⏱️' : raw.icon === 'Gem' ? '💎' : '🛡️'}</span>,
            unlocked: isUnlocked,
            purchasable: hasPrerequisites && !isUnlocked,
          };
        });
        
        setNodes(mappedNodes);
      }
    } catch (err) {
      console.error("Error fetching skill tree data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillData();
  }, [userId]);

  const handlePurchase = async (nodeId: string) => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    
    try {
      const { data, error } = await (supabase as any).rpc('purchase_skill_node', {
        user_uuid: userId,
        target_skill_id: nodeId
      });

      if (error) throw error;
      if (data && (data as any).error) throw new Error((data as any).error);

      toast({ title: 'Skill Unlocked!', description: 'You have successfully purchased this skill.', variant: 'default' });
      
      // Refresh the tree
      await fetchSkillData();
    } catch (err: any) {
      toast({ title: 'Purchase Failed', description: err.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-50 p-6 rounded-2xl shadow-inner border border-slate-200 flex justify-center items-center h-48">
        <Loader2 className="animate-spin text-slate-400 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="relative">
      {isPurchasing && (
        <div className="absolute inset-0 bg-white/50 z-10 flex justify-center items-center rounded-2xl">
           <Loader2 className="animate-spin text-primary w-8 h-8" />
        </div>
      )}
      <SkillTree 
        skillGems={userGems}
        nodes={nodes}
        onPurchase={handlePurchase}
      />
    </div>
  );
};
