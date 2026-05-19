import React from 'react';
import { cn } from '@/lib/utils';
import { Lock, Unlock, CheckCircle } from 'lucide-react';

export interface SkillNode {
  id: string;
  label: string;
  description: string;
  cost: number;
  unlocked: boolean;
  purchasable: boolean; // if parent is unlocked
  icon: React.ReactNode;
}

interface SkillTreeProps {
  skillGems: number;
  nodes: SkillNode[];
  onPurchase: (nodeId: string) => void;
}

export const SkillTree: React.FC<SkillTreeProps> = ({
  skillGems,
  nodes,
  onPurchase
}) => {
  return (
    <div className="bg-slate-50 p-6 rounded-2xl shadow-inner border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Skill Tree</h2>
        <div className="bg-white px-4 py-1.5 rounded-full shadow-sm font-bold text-slate-700 border border-slate-100">
          <span className="text-purple-500 mr-2">✦</span>
          {skillGems} SP
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nodes.map((node) => (
          <div 
            key={node.id} 
            className={cn(
              "flex items-start gap-4 p-4 rounded-xl border-2 transition-all",
              node.unlocked 
                ? "bg-green-50 border-green-200" 
                : node.purchasable 
                  ? "bg-white border-blue-200 hover:border-blue-400 cursor-pointer shadow-sm" 
                  : "bg-slate-100 border-slate-200 opacity-60 grayscale"
            )}
            onClick={() => {
              if (node.purchasable && !node.unlocked && skillGems >= node.cost) {
                onPurchase(node.id);
              }
            }}
          >
            <div className={cn(
              "p-3 rounded-lg text-white shadow-sm flex-shrink-0",
              node.unlocked ? "bg-green-500" : "bg-slate-400"
            )}>
              {node.icon}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-800">{node.label}</h3>
                {node.unlocked ? (
                  <CheckCircle className="text-green-500" size={18} />
                ) : node.purchasable ? (
                  <Unlock className="text-blue-400" size={18} />
                ) : (
                  <Lock className="text-slate-400" size={18} />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{node.description}</p>
              
              {!node.unlocked && (
                <div className="mt-3">
                  <span className={cn(
                    "text-xs font-bold px-2 py-1 rounded",
                    skillGems >= node.cost ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                  )}>
                    Cost: {node.cost} SP
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
