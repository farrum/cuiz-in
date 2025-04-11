
import React from 'react';
import ProfileEditor from '@/components/ProfileEditor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRound } from 'lucide-react';

interface ProfileHeaderProps {
  username: string | null;
  userUpi: string;
  userId: string | null;
  profilePicture: string;
  onProfileUpdate: (data: {
    displayName?: string;
    upiId?: string;
    profilePicture?: string;
  }) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username,
  userUpi,
  userId,
  profilePicture,
  onProfileUpdate,
}) => {
  const renderProfileAvatar = () => {
    if (profilePicture) {
      if (profilePicture.startsWith('http') || profilePicture.startsWith('data:')) {
        return (
          <Avatar className="w-20 h-20 border-4 border-primary/10">
            <AvatarImage src={profilePicture} alt={username || 'User'} />
            <AvatarFallback className="bg-primary/10 text-xl font-semibold">
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        );
      } else {
        switch (profilePicture) {
          case 'user-round':
            return (
              <Avatar className="w-20 h-20 border-4 border-primary/10">
                <AvatarFallback className="bg-primary/10">
                  <UserRound className="h-12 w-12 text-primary" />
                </AvatarFallback>
              </Avatar>
            );
          case 'smile':
            return (
              <Avatar className="w-20 h-20 border-4 border-primary/10">
                <AvatarFallback className="bg-primary/10 text-3xl">
                  😊
                </AvatarFallback>
              </Avatar>
            );
          case 'robot':
            return (
              <Avatar className="w-20 h-20 border-4 border-primary/10">
                <AvatarFallback className="bg-primary/10 text-3xl">
                  🤖
                </AvatarFallback>
              </Avatar>
            );
          case 'graduation-cap':
            return (
              <Avatar className="w-20 h-20 border-4 border-primary/10">
                <AvatarFallback className="bg-primary/10 text-3xl">
                  🎓
                </AvatarFallback>
              </Avatar>
            );
          case 'award':
            return (
              <Avatar className="w-20 h-20 border-4 border-primary/10">
                <AvatarFallback className="bg-primary/10 text-3xl">
                  🏆
                </AvatarFallback>
              </Avatar>
            );
          default:
            return (
              <Avatar className="w-20 h-20 border-4 border-primary/10">
                <AvatarFallback className="bg-primary/10 text-2xl font-semibold">
                  {username ? username.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
            );
        }
      }
    }
    
    return (
      <Avatar className="w-20 h-20 border-4 border-primary/10">
        <AvatarFallback className="bg-primary/10 text-2xl font-semibold">
          {username ? username.charAt(0).toUpperCase() : 'U'}
        </AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div className="glass p-6 rounded-xl shadow-md flex items-center gap-4">
      {renderProfileAvatar()}
      
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold">{username || 'User'}</h2>
          <ProfileEditor 
            userName={username || ''}
            userUpi={userUpi}
            userId={userId || ''}
            profilePicture={profilePicture}
            onProfileUpdate={onProfileUpdate}
          />
        </div>
        {userUpi && (
          <p className="text-sm text-muted-foreground">
            UPI ID: {userUpi}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
