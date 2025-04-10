
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AttendanceRecord } from './types';
import { CalendarIcon, Check, Loader2, User } from 'lucide-react';
import { format } from 'date-fns';

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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="md:col-span-1">
        <div className="mb-4">
          <label className="text-sm font-medium" htmlFor="user-select">
            Select User
          </label>
          <Select 
            value={selectedUser || ""} 
            onValueChange={onUserSelect}
          >
            <SelectTrigger id="user-select" className="mt-1">
              <SelectValue placeholder="Choose a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              if (selectedUser) {
                onRefresh(selectedUser);
              }
            }}
          >
            Refresh User Data
          </Button>
        </div>
        
        {selectedUser && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium">User Status</h3>
            <div className="p-3 bg-muted rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm">Last Login</span>
                <span className="text-sm font-medium">
                  {getLastLoginDate(selectedUser)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm">Total Days Active</span>
                <span className="text-sm font-medium">
                  {userHistory[selectedUser] ? userHistory[selectedUser].length : 0}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm">Status</span>
                <span className="text-sm font-medium">
                  {users.find(u => u.id === selectedUser)?.suspended ? (
                    <span className="text-red-500">Suspended</span>
                  ) : (
                    <span className="text-green-500">Active</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="md:col-span-2">
        {userHistoryLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3">Loading user history...</span>
          </div>
        ) : selectedUser ? (
          userHistory[selectedUser] && userHistory[selectedUser].length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-medium">Login History</h3>
              <div className="max-h-[400px] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Login Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userHistory[selectedUser]
                      .sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime())
                      .map(record => (
                        <TableRow key={record.id}>
                          <TableCell>{formatAttendanceDate(record.attendance_date)}</TableCell>
                          <TableCell>
                            {record.login_time ? format(new Date(record.login_time), 'HH:mm:ss') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Check className="h-4 w-4 mr-1 text-green-600" />
                              Present
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-md">
              <CalendarIcon className="h-16 w-16 mb-4" strokeWidth={1} />
              <p className="text-lg font-medium">No login history found for this user</p>
              <p className="text-sm text-muted-foreground mt-1">The user has not logged in yet</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-md">
            <User className="h-16 w-16 mb-4" strokeWidth={1} />
            <p className="text-lg font-medium">Select a user to view their attendance history</p>
            <p className="text-sm text-muted-foreground mt-1">Choose a user from the dropdown menu</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHistoryView;
