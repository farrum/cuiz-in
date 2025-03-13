
import React, { useState } from 'react';
import { toast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from '../utils/quizData';
import { Button } from '@/components/ui/button';
import { UserPlus, Copy, Share2, UserCheck, X, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReferralEntry {
  id: string;
  email: string;
  name: string;
  date: string;
  status: 'pending' | 'active' | 'inactive';
  lastActive: string;
  monthsActive: number;
  totalEarned: number;
}

const ReferralSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [referrals, setReferrals] = useState<ReferralEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REFERRALS);
    return saved ? JSON.parse(saved) : [];
  });
  
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    // Check if email already exists
    if (referrals.some(r => r.email === email)) {
      toast({
        title: "Already Invited",
        description: "This email has already been invited",
        variant: "destructive",
      });
      return;
    }
    
    // Create new referral entry
    const newReferral: ReferralEntry = {
      id: Date.now().toString(),
      email,
      name: email.split('@')[0], // Simple name extraction from email
      date: new Date().toISOString(),
      status: 'pending',
      lastActive: '',
      monthsActive: 0,
      totalEarned: 0
    };
    
    const updatedReferrals = [...referrals, newReferral];
    setReferrals(updatedReferrals);
    localStorage.setItem(STORAGE_KEYS.REFERRALS, JSON.stringify(updatedReferrals));
    
    // In a real app, this would send an email - we'll just simulate it
    toast({
      title: "Invitation Sent!",
      description: `An invitation has been sent to ${email}`,
    });
    
    setEmail('');
    
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
    localStorage.setItem(STORAGE_KEYS.REFERRALS, JSON.stringify(updated));
    
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
    localStorage.setItem(STORAGE_KEYS.REFERRALS, JSON.stringify(updated));
    
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
  
  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${Date.now()}`;
    navigator.clipboard.writeText(link);
    
    toast({
      title: "Link Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <UserCheck className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="quiz-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-medium">Refer Friends</h3>
        <div className="rounded-full bg-primary/10 text-primary px-3 py-1 text-sm">
          ₹500 per month
        </div>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Invite your friends to play QuizPoints and earn ₹500 for each friend who joins and plays actively! 
        You'll continue to earn ₹500 every month your friend remains active.
      </p>
      
      <form onSubmit={handleInvite} className="mb-6">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            <UserPlus className="w-4 h-4 mr-2" />
            <span>Invite</span>
          </Button>
        </div>
      </form>
      
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">Or share your referral link</span>
        <Button variant="outline" size="sm" onClick={copyReferralLink}>
          <Copy className="w-4 h-4 mr-2" />
          <span>Copy Link</span>
        </Button>
      </div>
      
      {referrals.length > 0 && (
        <div className="mt-8">
          <h4 className="font-medium mb-4">Your Referrals</h4>
          
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Friend</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell>
                      <div className="font-medium">{ref.name}</div>
                      <div className="text-xs text-muted-foreground">{ref.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ref.status)}
                        <span className="capitalize">{ref.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(ref.lastActive)}</TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">₹{ref.totalEarned}</div>
                      <div className="text-xs text-muted-foreground">
                        {ref.monthsActive} month{ref.monthsActive !== 1 ? 's' : ''}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Demo buttons - For testing only */}
          <div className="mt-4 border-t border-dashed pt-4">
            <div className="text-xs text-muted-foreground mb-2">Demo Controls:</div>
            <div className="flex flex-wrap gap-2">
              {referrals.length > 0 && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => simulateMonthlyActivity(referrals[0].id, true)}
                  >
                    Simulate Monthly Activity
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => simulateMonthlyActivity(referrals[0].id, false)}
                  >
                    Simulate Inactivity
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralSection;
