
import React from 'react';
import AdminNotificationsList from './notifications/AdminNotificationsList';

const AdminNotifications: React.FC = () => {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-4">Admin Notifications</h1>
      <AdminNotificationsList />
    </div>
  );
};

export default AdminNotifications;
