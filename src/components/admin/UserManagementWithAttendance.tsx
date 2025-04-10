
import React from 'react';
import UserAttendanceTracker from './UserAttendanceTracker';

const UserManagementWithAttendance: React.FC = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">User Management</h2>
      <UserAttendanceTracker />
    </div>
  );
};

export default UserManagementWithAttendance;
