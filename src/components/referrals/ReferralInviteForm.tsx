
import React, { useState } from 'react';
import { toast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus } from 'lucide-react';
import { STORAGE_KEYS } from '@/types/quiz';
import { ReferralEntry } from '@/types/referral';

interface ReferralInviteFormProps {
  addReferral: (referral: ReferralEntry) => void;
}

const ReferralInviteForm: React.FC<ReferralInviteFormProps> = ({ addReferral }) => {
  const [email, setEmail] = useState('');
  
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
    
    addReferral(newReferral);
    setEmail('');
  };

  return (
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
  );
};

export default ReferralInviteForm;
