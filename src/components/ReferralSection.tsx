
import React, { useState } from 'react';
import { toast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from '../utils/quizData';
import { Button } from '@/components/ui/button';
import { UserPlus, Copy, Share2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ReferralEntry {
  id: string;
  email: string;
  date: string;
  status: 'pending' | 'completed';
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
      date: new Date().toISOString(),
      status: 'pending'
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
    const updated = referrals.map(ref => 
      ref.id === id ? { ...ref, status: 'completed' as const } : ref
    );
    setReferrals(updated);
    localStorage.setItem(STORAGE_KEYS.REFERRALS, JSON.stringify(updated));
    
    // Add 20 points for successful referral
    const currentPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    const newPoints = currentPoints + 20;
    localStorage.setItem(STORAGE_KEYS.USER_POINTS, newPoints.toString());
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('pointsUpdated'));
    
    toast({
      title: "Referral Bonus!",
      description: "Your friend signed up. You earned 20 points!",
    });
  };
  
  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${Date.now()}`;
    navigator.clipboard.writeText(link);
    
    toast({
      title: "Link Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  return (
    <div className="quiz-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-medium">Refer Friends</h3>
        <div className="rounded-full bg-primary/10 text-primary px-3 py-1 text-sm">
          +20 pts per friend
        </div>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Invite your friends to play QuizPoints and earn 20 points for each friend who joins!
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
        <div className="mt-6">
          <h4 className="font-medium mb-3">Your Referrals</h4>
          
          <div className="space-y-3">
            {referrals.map((ref) => (
              <div 
                key={ref.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-secondary"
              >
                <div>
                  <div className="font-medium">{ref.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(ref.date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  {ref.status === 'completed' ? (
                    <span className="text-sm px-2 py-1 rounded-full bg-green-100 text-green-700">
                      +20 pts
                    </span>
                  ) : (
                    <span className="text-sm px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralSection;
