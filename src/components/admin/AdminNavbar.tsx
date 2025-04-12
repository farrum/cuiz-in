
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Bell, User, LogOut, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import AdminNotificationsList from './notifications/AdminNotificationsList';

const AdminNavbar: React.FC<{ adminName: string; onLogout: () => void }> = ({ adminName, onLogout }) => {
  const { unreadCount } = useAdminNotifications();

  return (
    <div className="flex items-center space-x-4">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <div className="flex items-center">
                <Bell className="mr-1 h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-red-500">{unreadCount}</Badge>
                )}
              </div>
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4">
                <li className="row-span-3">
                  <NavigationMenuLink asChild>
                    <div className="h-[400px] overflow-auto">
                      <AdminNotificationsList />
                    </div>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <User className="mr-1 h-4 w-4" />
              {adminName}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[200px] gap-3 p-4">
                <li className="row-span-3">
                  <NavigationMenuLink asChild>
                    <Link
                      to="/admin/sync"
                      className="flex w-full items-center gap-2 p-2 text-sm hover:bg-muted rounded-md"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </NavigationMenuLink>
                </li>
                <li>
                  <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-2 p-2 text-sm hover:bg-muted rounded-md text-red-500"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};

export default AdminNavbar;
