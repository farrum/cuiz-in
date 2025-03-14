
import { Award, Star, Zap, BookOpen, Target, Trophy, Medal, Crown, Flag } from 'lucide-react';

export interface BadgeType {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: {
    type: 'questions_answered' | 'daily_streak' | 'monthly_complete' | 'referrals' | 'custom';
    threshold: number;
  };
  colorClass: string;
  bgClass: string;
}

export const DEFAULT_BADGES: BadgeType[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'Answer 10 questions',
    icon: 'Award',
    criteria: {
      type: 'questions_answered',
      threshold: 10
    },
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-100'
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'Answer 50 questions',
    icon: 'Star',
    criteria: {
      type: 'questions_answered',
      threshold: 50
    },
    colorClass: 'text-green-600',
    bgClass: 'bg-green-100'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Answer 100 questions',
    icon: 'Zap',
    criteria: {
      type: 'questions_answered',
      threshold: 100
    },
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-100'
  },
  {
    id: 'expert',
    name: 'Expert',
    description: 'Answer 500 questions',
    icon: 'Trophy',
    criteria: {
      type: 'questions_answered',
      threshold: 500
    },
    colorClass: 'text-orange-600',
    bgClass: 'bg-orange-100'
  },
  {
    id: 'streak_3',
    name: 'Consistent',
    description: 'Complete daily target 3 days in a row',
    icon: 'Flag',
    criteria: {
      type: 'daily_streak',
      threshold: 3
    },
    colorClass: 'text-red-600',
    bgClass: 'bg-red-100'
  },
  {
    id: 'streak_7',
    name: 'Dedicated',
    description: 'Complete daily target 7 days in a row',
    icon: 'Target',
    criteria: {
      type: 'daily_streak',
      threshold: 7
    },
    colorClass: 'text-indigo-600',
    bgClass: 'bg-indigo-100'
  },
  {
    id: 'monthly_hero',
    name: 'Monthly Hero',
    description: 'Complete monthly target once',
    icon: 'Crown',
    criteria: {
      type: 'monthly_complete',
      threshold: 1
    },
    colorClass: 'text-yellow-600',
    bgClass: 'bg-yellow-100'
  },
  {
    id: 'referrals_5',
    name: 'Influencer',
    description: 'Refer 5 active friends',
    icon: 'Medal',
    criteria: {
      type: 'referrals',
      threshold: 5
    },
    colorClass: 'text-pink-600',
    bgClass: 'bg-pink-100'
  }
];

export const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Award': 
      return Award;
    case 'Star': 
      return Star;
    case 'Zap': 
      return Zap;
    case 'BookOpen': 
      return BookOpen;
    case 'Target': 
      return Target;
    case 'Trophy': 
      return Trophy;
    case 'Medal': 
      return Medal;
    case 'Crown': 
      return Crown;
    case 'Flag': 
      return Flag;
    default: 
      return Award;
  }
};

export interface UserBadge {
  id: string;
  badgeId: string;
  userId: string;
  earnedAt: string;
  progress?: number;
}

export const checkAndAwardBadges = (userId: string): UserBadge[] => {
  // Get badges from localStorage
  const storedBadges = JSON.parse(localStorage.getItem('quiz_app_badges') || '[]');
  const badges = storedBadges.length > 0 ? storedBadges : DEFAULT_BADGES;
  
  // Get user badges
  const userBadges = JSON.parse(localStorage.getItem(`quiz_app_user_badges_${userId}`) || '[]');
  
  // Get user stats
  const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
  const dailyStreakData = JSON.parse(localStorage.getItem('quiz_app_daily_streaks') || '{}');
  const userStreak = dailyStreakData[userId] || 0;
  const achievementsData = JSON.parse(localStorage.getItem('quiz_app_achievements') || '[]');
  const monthlyCompletions = achievementsData.filter((a: any) => a.type === 'monthly_target').length;
  const referralsData = JSON.parse(localStorage.getItem(STORAGE_KEYS.REFERRALS) || '[]');
  const activeReferrals = referralsData.filter((r: any) => r.status === 'completed').length;
  
  // Check which new badges to award
  const newBadges: UserBadge[] = [];

  // Question badges
  badges
    .filter(badge => badge.criteria.type === 'questions_answered')
    .forEach(badge => {
      const alreadyEarned = userBadges.some((ub: UserBadge) => ub.badgeId === badge.id);
      
      if (!alreadyEarned && completedQuestions.length >= badge.criteria.threshold) {
        const newBadge = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          badgeId: badge.id,
          userId: userId,
          earnedAt: new Date().toISOString(),
          progress: 100
        };
        newBadges.push(newBadge);
      }
    });
  
  // Streak badges
  badges
    .filter(badge => badge.criteria.type === 'daily_streak')
    .forEach(badge => {
      const alreadyEarned = userBadges.some((ub: UserBadge) => ub.badgeId === badge.id);
      
      if (!alreadyEarned && userStreak >= badge.criteria.threshold) {
        const newBadge = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          badgeId: badge.id,
          userId: userId,
          earnedAt: new Date().toISOString(),
          progress: 100
        };
        newBadges.push(newBadge);
      }
    });
  
  // Monthly completion badges
  badges
    .filter(badge => badge.criteria.type === 'monthly_complete')
    .forEach(badge => {
      const alreadyEarned = userBadges.some((ub: UserBadge) => ub.badgeId === badge.id);
      
      if (!alreadyEarned && monthlyCompletions >= badge.criteria.threshold) {
        const newBadge = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          badgeId: badge.id,
          userId: userId,
          earnedAt: new Date().toISOString(),
          progress: 100
        };
        newBadges.push(newBadge);
      }
    });
  
  // Referral badges
  badges
    .filter(badge => badge.criteria.type === 'referrals')
    .forEach(badge => {
      const alreadyEarned = userBadges.some((ub: UserBadge) => ub.badgeId === badge.id);
      
      if (!alreadyEarned && activeReferrals >= badge.criteria.threshold) {
        const newBadge = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          badgeId: badge.id,
          userId: userId,
          earnedAt: new Date().toISOString(),
          progress: 100
        };
        newBadges.push(newBadge);
      }
    });
  
  // Save newly earned badges
  if (newBadges.length > 0) {
    const updatedUserBadges = [...userBadges, ...newBadges];
    localStorage.setItem(`quiz_app_user_badges_${userId}`, JSON.stringify(updatedUserBadges));
  }
  
  return [...userBadges, ...newBadges];
};

export const getUserBadges = (userId: string): UserBadge[] => {
  return JSON.parse(localStorage.getItem(`quiz_app_user_badges_${userId}`) || '[]');
};

export const getAllBadges = (): BadgeType[] => {
  const storedBadges = JSON.parse(localStorage.getItem('quiz_app_badges') || '[]');
  return storedBadges.length > 0 ? storedBadges : DEFAULT_BADGES;
};

export const getBadgeDetail = (badgeId: string): BadgeType | undefined => {
  const badges = getAllBadges();
  return badges.find(badge => badge.id === badgeId);
};
