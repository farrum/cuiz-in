
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProfileEditor from './editor/ProfileEditor';

interface ProfileHeaderProps {
  username: string | null;
  displayName: string | null;
  profilePicture: string;
  userId: string | null;
  userUpi?: string;
  email?: string | null;
  phone?: string | null;
  provider?: string;
  onProfileUpdate?: (data: {
    displayName?: string;
    upiId?: string;
    profilePicture?: string;
    email?: string;
    phone?: string;
    username?: string;
  }) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username,
  displayName,
  profilePicture,
  userId,
  userUpi = '',
  email = '',
  phone = '',
  provider = 'email',
  onProfileUpdate,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const joinedDate = new Date().toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });

  const handleLogout = async () => {
    try {
      // Clear local storage data
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
      localStorage.removeItem(STORAGE_KEYS.USER_NAME);
      localStorage.removeItem(STORAGE_KEYS.USER_GEMS);
      localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
      localStorage.removeItem(STORAGE_KEYS.USER_AUTH);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
      
      // Sign out from Supabase if applicable
      await supabase.auth.signOut();
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account"
      });
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profilePicture} alt={displayName || username || 'User'} />
            <AvatarFallback>
              {displayName ? displayName.charAt(0).toUpperCase() : (username ? username.charAt(0).toUpperCase() : 'U')}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{displayName || username}</h2>
              {userId && onProfileUpdate && (
                <ProfileEditor
                  userName={username || ''}
                  displayName={displayName || ''}
                  userUpi={userUpi}
                  userId={userId}
                  profilePicture={profilePicture}
                  email={email}
                  phone={phone}
                  provider={provider}
                  onProfileUpdate={onProfileUpdate}
                />
              )}
            </div>
            <p className="text-sm text-muted-foreground">Joined {joinedDate}</p>
          </div>
        </div>

        <Button variant="outline" className="gap-2" onClick={handleLogout}>
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
