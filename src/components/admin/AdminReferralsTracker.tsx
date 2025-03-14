import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Award, TrendingUp } from 'lucide-react';
import { STORAGE_KEYS } from '@/utils/quizData';

interface ReferralData {
  referrerId: string;
  referrerName: string;
  referredId: string;
  referredName: string;
  referredEmail: string;
  date: string;
  status: 'active' | 'inactive' | 'pending';
  earnings: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  suspended: boolean;
  referredBy?: string;
  joinDate: string;
}

const AdminReferralsTracker: React.FC = () => {
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const usersFromStorage = localStorage.getItem('admin_users');
    const loadedUsers = usersFromStorage ? JSON.parse(usersFromStorage) : [];
    setUsers(loadedUsers);
    
    const mockReferrals: ReferralData[] = [];
    
    loadedUsers.forEach((user: User) => {
      const referredUsers = loadedUsers.filter((u: User) => u.referredBy === user.id);
      
      referredUsers.forEach((referred: User) => {
        mockReferrals.push({
          referrerId: user.id,
          referrerName: user.name,
          referredId: referred.id,
          referredName: referred.name,
          referredEmail: referred.email,
          date: new Date(referred.joinDate).toISOString().slice(0, 10),
          status: referred.suspended ? 'inactive' : 'active',
          earnings: Math.floor(Math.random() * 500)
        });
      });
    });
    
    const referralsFromStorage = localStorage.getItem('admin_referrals');
    if (referralsFromStorage) {
      setReferrals(JSON.parse(referralsFromStorage));
    } else if (mockReferrals.length > 0) {
      setReferrals(mockReferrals);
      localStorage.setItem('admin_referrals', JSON.stringify(mockReferrals));
    }
  }, []);
  
  const filteredReferrals = referrals.filter(referral => 
    referral.referrerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    referral.referredName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referredEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(r => r.status === 'active').length;
  const totalEarnings = referrals.reduce((sum, r) => sum + r.earnings, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Referrals Tracker</h2>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search referrals..."
            className="pl-8 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Referrals</p>
              <h3 className="text-2xl font-bold">{totalReferrals}</h3>
            </div>
            <Award className="h-10 w-10 text-primary opacity-75" />
          </div>
        </div>
        
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Referrals</p>
              <h3 className="text-2xl font-bold">{activeReferrals}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {totalReferrals > 0 
                  ? `${Math.round((activeReferrals / totalReferrals) * 100)}% active rate`
                  : 'No referrals yet'}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-500 opacity-75" />
          </div>
        </div>
        
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Earnings Paid</p>
              <h3 className="text-2xl font-bold">₹{totalEarnings}</h3>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              ₹
            </div>
          </div>
        </div>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referrer</TableHead>
              <TableHead>Referred User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Earnings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReferrals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No referrals found
                </TableCell>
              </TableRow>
            ) : (
              filteredReferrals.map((referral, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="font-medium">{referral.referrerName}</div>
                    <div className="text-xs text-muted-foreground">ID: {referral.referrerId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{referral.referredName}</div>
                    <div className="text-xs text-muted-foreground">{referral.referredEmail}</div>
                  </TableCell>
                  <TableCell>{referral.date}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${referral.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : referral.status === 'inactive'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}
                    >
                      {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">₹{referral.earnings}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminReferralsTracker;
