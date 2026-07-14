import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProfileEditor from './editor/ProfileEditor';
import { getEquippedItems, ARMORY_ITEMS } from '@/utils/shopData';
import { cn } from '@/lib/utils';

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
  const [profileTrigger, setProfileTrigger] = useState(0);
  
  useEffect(() => {
    const handleUpdate = () => {
      setProfileTrigger(prev => prev + 1);
    };
    window.addEventListener('profileUpdated', handleUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleUpdate);
    };
  }, []);

  const joinedDate = new Date().toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });

  const handleLogout = async () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
      localStorage.removeItem(STORAGE_KEYS.USER_NAME);
      localStorage.removeItem(STORAGE_KEYS.USER_GEMS);
      localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
      localStorage.removeItem(STORAGE_KEYS.USER_AUTH);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
      
      await supabase.auth.signOut();
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account"
      });
      
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

  // Load equipped items
  const equipped = getEquippedItems();
  const equippedFrame = ARMORY_ITEMS.find(item => item.id === equipped.avatar_frame);
  const equippedWeapon = ARMORY_ITEMS.find(item => item.id === equipped.weapon);
  const equippedShield = ARMORY_ITEMS.find(item => item.id === equipped.shield);
  const isNavyBackdrop = equipped.backdrop === 'barons_banner';

  return (
    <div className={cn(
      "wooden-door p-6 shadow-xl text-stone-100 transition-all duration-500",
      isNavyBackdrop && "bg-gradient-to-b from-slate-900 via-blue-950 to-indigo-900 border-indigo-500/40 shadow-[inset_0_1px_20px_rgba(59,130,246,0.15)]"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          
          {/* Avatar with Custom Visual Upgrades */}
          <div className="relative">
            <Avatar className={cn(
              "w-16 h-16 border-2 border-amber-600/40 transition-all duration-300", 
              equippedFrame?.previewClass
            )}>
              <AvatarImage src={profilePicture} alt={displayName || username || 'User'} />
              <AvatarFallback className="bg-stone-900 text-amber-500 font-serif">
                {displayName ? displayName.charAt(0).toUpperCase() : (username ? username.charAt(0).toUpperCase() : 'U')}
              </AvatarFallback>
            </Avatar>
            {equippedFrame && (
              <span className="absolute -top-2.5 -right-2 text-xl select-none animate-pulse filter drop-shadow">
                {equippedFrame.emoji}
              </span>
            )}
          </div>
          
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

      {/* Equipment Badges / Enhancements */}
      <div className="flex flex-wrap gap-3 mt-4">
        <div className="bg-stone-950/80 border border-stone-800 text-stone-300 rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-wider">
          29 questions answered
        </div>
        <div className="bg-amber-950/40 border border-amber-800/30 text-amber-500 rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-wider">
          Active Player
        </div>

        {equippedWeapon && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
            <span>{equippedWeapon.emoji}</span>
            <span>{equippedWeapon.name}</span>
          </div>
        )}

        {equippedShield && (
          <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
            <span>{equippedShield.emoji}</span>
            <span>{equippedShield.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
