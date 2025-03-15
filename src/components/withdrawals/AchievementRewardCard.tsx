
import React from 'react';
import { Award } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Achievement } from '@/types/withdrawal';

interface AchievementRewardCardProps {
  achievements: Achievement[];
  formatMonth: (monthStr: string) => string;
  onClaim: (achievement: Achievement) => void;
}

const AchievementRewardCard: React.FC<AchievementRewardCardProps> = ({
  achievements,
  formatMonth,
  onClaim
}) => {
  if (achievements.length === 0) return null;
  
  return (
    <div className="mb-8">
      <h4 className="font-medium mb-3 flex items-center">
        <Award className="w-5 h-5 mr-2 text-primary" />
        Available Rewards
      </h4>
      
      <div className="space-y-4">
        {achievements.map((achievement) => (
          <div key={achievement.id} className="p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium">Monthly Target Completed</h5>
                <p className="text-sm text-muted-foreground">
                  {formatMonth(achievement.month)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold mb-2">₹{achievement.reward.toFixed(2)}</div>
                <Button 
                  size="sm" 
                  onClick={() => onClaim(achievement)}
                  className="btn-shine"
                >
                  Claim Reward
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementRewardCard;
