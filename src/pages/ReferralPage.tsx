
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import ReferralSection from '@/components/ReferralSection';
import { STORAGE_KEYS } from '@/utils/quizData';
import { UserCheck, Clock, X, User } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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

const ReferralPage = () => {
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);

  useEffect(() => {
    const savedReferrals = localStorage.getItem(STORAGE_KEYS.REFERRALS);
    if (savedReferrals) {
      setReferrals(JSON.parse(savedReferrals));
    }
  }, []);

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
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-24 md:py-24">
        <h1 className="text-3xl font-bold mb-8 animate-fade-in">My Referrals</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Referral section for inviting new friends */}
          <div className="md:col-span-1">
            <ReferralSection />
          </div>
          
          {/* List of referred users */}
          <div className="md:col-span-1">
            <div className="quiz-card">
              <h3 className="text-xl font-medium mb-6">Referred Friends</h3>
              
              {referrals.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <User className="w-10 h-10 text-muted-foreground/50 mb-4" />
                  <p>You haven't referred any friends yet.</p>
                  <p className="text-sm mt-2">Invite friends to earn rewards!</p>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReferralPage;
