
import React from 'react';
import { BadgeType, UserBadge, getAllBadges, getUserBadges, getIconComponent } from '@/utils/badgeData';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface BadgesSectionProps {
  userId: string;
  limit?: number;
  showProgress?: boolean;
}

const BadgesSection: React.FC<BadgesSectionProps> = ({ 
  userId, 
  limit,
  showProgress = true
}) => {
  const allBadges = getAllBadges();
  const userBadges = getUserBadges(userId);
  
  // Combine badge definitions with user badge data
  const badges = userBadges.map(userBadge => {
    const badgeDefinition = allBadges.find(b => b.id === userBadge.badgeId);
    return {
      ...userBadge,
      definition: badgeDefinition
    };
  });
  
  // Limit badges if needed
  const displayBadges = limit ? badges.slice(0, limit) : badges;
  
  // Calculate progress for unearned badges
  const getProgressForBadge = (badge: BadgeType): number => {
    if (badge.criteria.type === 'questions_answered') {
      const completedQuestions = JSON.parse(localStorage.getItem('quiz_app_completed_questions') || '[]');
      return Math.min(Math.floor((completedQuestions.length / badge.criteria.threshold) * 100), 100);
    }
    
    return 0;
  };
  
  // Get upcoming badges (not yet earned)
  const getUpcomingBadges = () => {
    if (!showProgress) return [];
    
    const earnedBadgeIds = userBadges.map(ub => ub.badgeId);
    return allBadges
      .filter(badge => !earnedBadgeIds.includes(badge.id))
      .map(badge => ({
        ...badge,
        progress: getProgressForBadge(badge)
      }))
      .filter(badge => badge.progress > 0)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3); // Show max 3 upcoming badges
  };
  
  const upcomingBadges = getUpcomingBadges();

  if (displayBadges.length === 0 && upcomingBadges.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No badges yet. Keep playing to earn badges!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {displayBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Earned Badges</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {displayBadges.map(badge => {
              if (!badge.definition) return null;
              
              const BadgeIcon = getIconComponent(badge.definition.icon);
              const earnedDate = new Date(badge.earnedAt);
              
              return (
                <TooltipProvider key={badge.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`flex flex-col items-center p-3 rounded-lg ${badge.definition.bgClass}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 bg-white/50 ${badge.definition.colorClass}`}>
                          <BadgeIcon className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-sm">{badge.definition.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(earnedDate, 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{badge.definition.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      )}
      
      {upcomingBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Upcoming Badges</h4>
          <div className="space-y-3">
            {upcomingBadges.map(badge => {
              const BadgeIcon = getIconComponent(badge.icon);
              
              return (
                <div key={badge.id} className="flex items-center p-3 rounded-lg bg-secondary/30">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${badge.bgClass} opacity-70`}>
                    <BadgeIcon className={`w-5 h-5 ${badge.colorClass}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium text-sm">{badge.name}</div>
                      <div className="text-xs text-muted-foreground">{badge.progress}%</div>
                    </div>
                    <Progress value={badge.progress} className="h-1.5" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {badge.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgesSection;
