
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileHeaderProps {
  username: string | null;
  profilePicture: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username,
  profilePicture,
}) => {
  const joinedDate = new Date().toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profilePicture} alt={username || 'User'} />
            <AvatarFallback>
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{username}</h2>
              <Button variant="ghost" size="sm" className="h-8">
                Edit
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Joined {joinedDate}</p>
          </div>
        </div>

        <Button variant="outline" className="gap-2">
          <LogOut className="h-4 w-4" />
          Log Out
        </Button>
      </div>

      <div className="flex gap-4 mt-4">
        <div className="bg-blue-50 rounded-md px-4 py-1 text-sm">
          29 questions answered
        </div>
        <div className="bg-blue-50 text-blue-600 rounded-md px-4 py-1 text-sm">
          Active Player
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
