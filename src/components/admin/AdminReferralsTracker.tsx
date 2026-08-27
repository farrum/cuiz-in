
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
import { Search, Award, TrendingUp, CheckCircle, XCircle, Loader } from 'lucide-react';
import { STORAGE_KEYS } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReferralData {
  id: string;
  referrerId: string;
  referrerName: string;
  referredId: string;
  referredName: string;
  referredEmail: string;
  date: string;
  status: 'active' | 'inactive' | 'pending';
  earnings: number;
  activeThisMonth: boolean;
  lastActiveDate?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  gems: number;
  suspended: boolean;
  referredBy?: string;
  joinDate: string;
}

const AdminReferralsTracker: React.FC = () => {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Get users first
        const usersFromStorage = localStorage.getItem('admin_users');
        const loadedUsers = usersFromStorage ? JSON.parse(usersFromStorage) : [];
        setUsers(loadedUsers);
        
        // Fetch referrals from Supabase
        const { data: supabaseReferrals, error } = await supabase
          .from('user_referrals')
          .select('*')
          .order('date', { ascending: false });
          
        if (error) {
          console.error('Error fetching referrals:', error);
          toast({
            title: "Error",
            description: "Failed to load referrals from database",
            variant: "destructive"
          });
          
          // Fall back to localStorage
          const referralsFromStorage = localStorage.getItem('admin_referrals');
          if (referralsFromStorage) {
            setReferrals(JSON.parse(referralsFromStorage));
          } else {
            // Generate mock data if no data exists
            generateAndSaveMockReferrals(loadedUsers);
          }
        } else if (supabaseReferrals && supabaseReferrals.length > 0) {
          // Transform Supabase data to match our interface
          const transformedReferrals: ReferralData[] = supabaseReferrals.map(ref => ({
            id: ref.id,
            referrerId: ref.referrer_id,
            referrerName: ref.referrer_name,
            referredId: ref.referred_id,
            referredName: ref.referred_name,
            referredEmail: ref.referred_email || '',
            date: ref.date,
            status: ref.status as 'active' | 'inactive' | 'pending',
            earnings: Number(ref.earnings),
            activeThisMonth: ref.active_this_month,
            lastActiveDate: ref.last_active_date
          }));
          
          setReferrals(transformedReferrals);
          
          // Sync with localStorage for backward compatibility
          localStorage.setItem('admin_referrals', JSON.stringify(transformedReferrals));
        } else {
          // No data in Supabase, check localStorage or generate mock data
          const referralsFromStorage = localStorage.getItem('admin_referrals');
          if (referralsFromStorage) {
            const storedReferrals = JSON.parse(referralsFromStorage);
            setReferrals(storedReferrals);
            
            // Sync localStorage data to Supabase
            await syncReferralsToSupabase(storedReferrals);
          } else {
            // Generate mock data
            generateAndSaveMockReferrals(loadedUsers);
          }
        }
      } catch (err) {
        console.error('Failed to fetch referrals data:', err);
        toast({
          title: "Error",
          description: "An error occurred while loading referrals",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Generate mock referrals and save to both localStorage and Supabase
  const generateAndSaveMockReferrals = async (loadedUsers: User[]) => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const mockReferrals: ReferralData[] = [];
    
    loadedUsers.forEach((user: User) => {
      const referredUsers = loadedUsers.filter((u: User) => u.referredBy === user.id);
      
      referredUsers.forEach((referred: User) => {
        const isActive = !referred.suspended && Math.random() > 0.3;
        const lastActiveDate = isActive 
          ? new Date(Date.now() - Math.floor(Math.random() * 25 * 24 * 60 * 60 * 1000)).toISOString()
          : undefined;
        
        const activeThisMonth = lastActiveDate 
          ? lastActiveDate.substring(0, 7) === currentMonth 
          : false;
        
        mockReferrals.push({
          id: Math.random().toString(36).substring(2, 15),
          referrerId: user.id,
          referrerName: user.name,
          referredId: referred.id,
          referredName: referred.name,
          referredEmail: referred.email,
          date: new Date(referred.joinDate).toISOString().slice(0, 10),
          status: referred.suspended ? 'inactive' : 'active',
          earnings: Math.floor(Math.random() * 500),
          activeThisMonth,
          lastActiveDate
        });
      });
    });
    
    if (mockReferrals.length > 0) {
      setReferrals(mockReferrals);
      localStorage.setItem('admin_referrals', JSON.stringify(mockReferrals));
      
      // Sync to Supabase
      await syncReferralsToSupabase(mockReferrals);
    }
  };
  
  // Sync referrals from localStorage to Supabase
  const syncReferralsToSupabase = async (referrals: ReferralData[]) => {
    try {
      for (const ref of referrals) {
        const { error } = await supabase
          .from('user_referrals')
          .upsert({
            id: ref.id,
            referrer_id: ref.referrerId,
            referrer_name: ref.referrerName,
            referred_id: ref.referredId,
            referred_name: ref.referredName,
            referred_email: ref.referredEmail,
            date: ref.date,
            status: ref.status,
            earnings: ref.earnings,
            active_this_month: ref.activeThisMonth,
            last_active_date: ref.lastActiveDate
          }, { onConflict: 'id' });
          
        if (error) {
          console.error('Error syncing referral to Supabase:', error);
        }
      }
    } catch (err) {
      console.error('Failed to sync referrals to Supabase:', err);
    }
  };
  
  const filteredReferrals = referrals.filter(referral => 
    referral.referrerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    referral.referredName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referredEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(r => r.status === 'active').length;
  const activeThisMonth = referrals.filter(r => r.activeThisMonth).length;
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
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
              <p className="text-sm font-medium text-muted-foreground">Active This Month</p>
              <h3 className="text-2xl font-bold">{activeThisMonth}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {activeReferrals > 0 
                  ? `${Math.round((activeThisMonth / activeReferrals) * 100)}% monthly activity`
                  : 'No active referrals'}
              </p>
            </div>
            <CheckCircle className="h-10 w-10 text-blue-500 opacity-75" />
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
      
      <div className="rounded-md border overflow-hidden bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>

              <TableHead>Referrer</TableHead>
              <TableHead>Referred User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Active This Month</TableHead>
              <TableHead className="text-right">Earnings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Loader className="w-8 h-8 mx-auto mb-2 text-muted-foreground animate-spin" />
                  Loading referrals...
                </TableCell>
              </TableRow>
            ) : filteredReferrals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No referrals found
                </TableCell>
              </TableRow>
            ) : (
              filteredReferrals.map((referral) => (
                <TableRow key={referral.id}>
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
                  <TableCell>
                    {referral.activeThisMonth ? (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm">Yes</span>
                        {referral.lastActiveDate && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {new Date(referral.lastActiveDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-sm">No</span>
                      </div>
                    )}
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
