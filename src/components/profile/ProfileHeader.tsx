
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
    <div className="wooden-door p-6 shadow-xl text-stone-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-amber-600/40">
            <AvatarImage src={profilePicture} alt={displayName || username || 'User'} />
            <AvatarFallback className="bg-stone-900 text-amber-500 font-serif">
              {displayName ? displayName.charAt(0).toUpperCase() : (username ? username.charAt(0).toUpperCase() : 'U')}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white font-serif" style={{ fontFamily: "'Cinzel', serif" }}>{displayName || username}</h2>
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
            <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider font-bold">Joined {joinedDate}</p>
          </div>
        </div>

        <Button variant="outline" className="gap-2 border-stone-850 hover:bg-stone-900 text-stone-300" onClick={handleLogout}>
          <LogOut className="h-4 w-4 text-red-500" />
          Log Out
        </Button>
      </div>

      <div className="flex gap-4 mt-4">
        <div className="bg-stone-950/80 border border-stone-800 text-stone-300 rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-wider">
          29 questions answered
        </div>
        <div className="bg-amber-950/40 border border-amber-800/30 text-amber-500 rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-wider">
          Active Player
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
