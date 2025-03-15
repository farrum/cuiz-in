
import { useState, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from '@/types/quiz';
import { ReferralEntry } from '@/types/referral';

export const useReferrals = () => {
  const [referrals, setReferrals] = useState<ReferralEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REFERRALS);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REFERRALS, JSON.stringify(referrals));
  }, [referrals]);

  const addReferral = (newReferral: ReferralEntry) => {
    // Check if email already exists
    if (referrals.some(r => r.email === newReferral.email)) {
      toast({
        title: "Already Invited",
        description: "This email has already been invited",
        variant: "destructive",
      });
      return;
    }
    
    const updatedReferrals = [...referrals, newReferral];
    setReferrals(updatedReferrals);
    
    // In a real app, this would send an email - we'll just simulate it
    toast({
      title: "Invitation Sent!",
      description: `An invitation has been sent to ${newReferral.email}`,
    });
    
    // Simulate a successful referral for demo purposes
    setTimeout(() => {
      simulateSuccessfulReferral(newReferral.id);
    }, 5000);
  };
  
  const simulateSuccessfulReferral = (id: string) => {
    // Update referral status
    const updated = referrals.map(ref => {
      if (ref.id === id) {
        // First month active - add ₹500
        return { 
          ...ref, 
          status: 'active' as const,
          lastActive: new Date().toISOString(),
          monthsActive: 1,
          totalEarned: 500
        };
      }
      return ref;
    });
    
    setReferrals(updated);
    
    // Add ₹500 for successful referral
    const currentPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    const newPoints = currentPoints + 20; // We add 20 points to the referrer
    localStorage.setItem(STORAGE_KEYS.USER_POINTS, newPoints.toString());
    
    // Add the money to the user's balance
    addReferralReward(500);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('pointsUpdated'));
    
    toast({
      title: "Referral Bonus!",
      description: "Your friend signed up and played! You earned ₹500!",
    });
  };
  
  const simulateMonthlyActivity = (id: string, isActive: boolean) => {
    // Update referral status for the new month
    const updated = referrals.map(ref => {
      if (ref.id === id) {
        if (isActive && ref.status === 'active') {
          // Another month active - add ₹500 more
          return { 
            ...ref, 
            lastActive: new Date().toISOString(),
            monthsActive: ref.monthsActive + 1,
            totalEarned: ref.totalEarned + 500
          };
        } else if (!isActive && ref.status === 'active') {
          // Friend stopped playing
          return { 
            ...ref, 
            status: 'inactive' as const,
          };
        } else if (isActive && ref.status === 'inactive') {
          // Friend resumed playing
          return { 
            ...ref, 
            status: 'active' as const,
            lastActive: new Date().toISOString(),
          };
        }
      }
      return ref;
    });
    
    setReferrals(updated);
    
    // If active, add another ₹500
    if (isActive) {
      // Add the money to the user's balance
      addReferralReward(500);
      
      toast({
        title: "Monthly Referral Bonus!",
        description: "Your friend is still active! You earned another ₹500!",
      });
    } else {
      toast({
        title: "Referral Status Update",
        description: "Your friend is no longer active this month.",
        variant: "destructive",
      });
    }
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('pointsUpdated'));
  };
  
  const addReferralReward = (amount: number) => {
    // Get current achievements/rewards
    const achievements = JSON.parse(localStorage.getItem('quiz_app_achievements') || '[]');
    
    // Add a new referral achievement
    achievements.push({
      id: Date.now().toString(),
      type: 'referral_reward',
      month: new Date().toISOString().slice(0, 7), // YYYY-MM
      reward: amount,
      date: new Date().toISOString(),
      claimed: false
    });
    
    localStorage.setItem('quiz_app_achievements', JSON.stringify(achievements));
  };

  return {
    referrals,
    addReferral,
    simulateMonthlyActivity
  };
};

export default useReferrals;
