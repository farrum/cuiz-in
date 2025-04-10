
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { AttendanceRecord } from './types';

interface UserHistoryViewProps {
  users: any[];
  selectedUser: string | null;
  userHistory: Record<string, AttendanceRecord[]>;
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
      
      {selectedUser && !userHistoryLoading && (
        <>
          <div className="text-sm">
            Last login: <span className="font-medium">{getLastLoginDate(selectedUser)}</span>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
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
