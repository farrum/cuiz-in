import React, { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, RefreshCw, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isValid } from 'date-fns';

interface UserHistoryViewProps {
  users: any[];
  selectedUser: string | null;
  userHistory: Record<string, any[]>;
  userHistoryLoading: boolean;
  onUserSelect: (userId: string) => void;
  onRefresh: (userId: string) => void;
  getLastLoginDate: (userId: string) => string;
  formatAttendanceDate: (dateStr: string) => string;
}

const UserHistoryView: React.FC<UserHistoryViewProps> = ({
  users,
  selectedUser,
  userHistory,
  userHistoryLoading,
  onUserSelect,
  onRefresh,
  getLastLoginDate,
  formatAttendanceDate
}) => {
  // Calculate consecutive days streak if we have history
  const calculateStreak = (history: any[]): number => {
    if (!history || history.length === 0) return 0;
    
    // Sort by date (most recent first)
    const sortedDates = [...history]
      .sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime())
      .map(record => record.attendance_date);
    
    // Get unique dates (in case there are multiple logins per day)
    const uniqueDates = Array.from(new Set(sortedDates));
    
    // Calculate streak
    let streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const current = new Date(uniqueDates[i-1]);
      const prev = new Date(uniqueDates[i]);
      
      // If dates are consecutive (difference is 1 day)
      const diffTime = current.getTime() - prev.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (Math.round(diffDays) === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Add function to fetch quiz activity
  const [quizActivity, setQuizActivity] = useState<any[]>([]);
  const [loadingQuizActivity, setLoadingQuizActivity] = useState(false);

  useEffect(() => {
    const fetchQuizActivity = async () => {
      if (!selectedUser) return;
      
      setLoadingQuizActivity(true);
      try {
        const { data, error } = await supabase
          .from('quiz_answers')
          .select('*')
          .eq('user_id', selectedUser)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setQuizActivity(data || []);
      } catch (error) {
        console.error('Error fetching quiz activity:', error);
      } finally {
        setLoadingQuizActivity(false);
      }
    };

    fetchQuizActivity();
  }, [selectedUser]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select
            value={selectedUser || ''}
            onValueChange={(value) => onUserSelect(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.username} {user.suspended ? "(Suspended)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedUser && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onRefresh(selectedUser)}
            disabled={userHistoryLoading}
          >
            {userHistoryLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      
      {selectedUser && !userHistoryLoading && userHistory[selectedUser] && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 flex items-center space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Login</p>
                <p className="font-medium">{getLastLoginDate(selectedUser)}</p>
              </div>
            </Card>
            
            <Card className="p-4 flex items-center space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance Streak</p>
                <p className="font-medium">
                  {calculateStreak(userHistory[selectedUser])} days
                </p>
              </div>
            </Card>
            
            <Card className="p-4 flex items-center space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Logins</p>
                <p className="font-medium">
                  {userHistory[selectedUser]?.length || 0}
                </p>
              </div>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg overflow-hidden">
              <h3 className="text-lg font-semibold p-4 bg-muted">Login History</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Login Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userHistory[selectedUser] && userHistory[selectedUser].length > 0 ? (
                    userHistory[selectedUser].map((record) => (
                      <tr key={record.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatAttendanceDate(record.attendance_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(record.login_time).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                        No login history found for this user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <h3 className="text-lg font-semibold p-4 bg-muted">Quiz Activity</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Questions Attempted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Gems Earned
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingQuizActivity ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      </td>
                    </tr>
                  ) : quizActivity.length > 0 ? (
                    // Group quiz activity by date
                    Object.entries(
                      quizActivity.reduce((acc: any, curr) => {
                        const date = new Date(curr.created_at).toLocaleDateString();
                        if (!acc[date]) {
                          acc[date] = {
                            count: 0,
                            gems: 0
                          };
                        }
                        acc[date].count++;
                        acc[date].gems += curr.points_earned || 0;
                        return acc;
                      }, {})
                    ).map(([date, stats]: [string, any]) => (
                      <tr key={date} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {stats.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {stats.gems}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                        No quiz activity found for this user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      {userHistoryLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-3">Loading user history...</span>
        </div>
      )}
      
      {!selectedUser && (
        <div className="text-center py-8 text-muted-foreground">
          Select a user to view their login history.
        </div>
      )}
    </div>
  );
};

export default UserHistoryView;
