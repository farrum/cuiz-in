
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Edit2, Save, X } from 'lucide-react';
import { ProfileEditorForm } from './ProfileEditorForm';
import { useProfileEditorState } from './useProfileEditorState';

interface ProfileEditorProps {
  userName: string;
  displayName: string;
  userUpi: string;
  userId: string;
  profilePicture?: string;
  email?: string | null;
  phone?: string | null;
  provider?: string;
  onProfileUpdate: (data: {
    displayName?: string;
    upiId?: string;
    profilePicture?: string;
    email?: string;
    phone?: string;
    username?: string;
  }) => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ 
  userName, 
  displayName,
  userUpi, 
  userId,
  profilePicture,
  email,
  phone,
  provider,
  onProfileUpdate 
}) => {
  const {
    isOpen,
    setIsOpen,
    selectedAvatar,
    isSessionValid,
    handleAvatarChange,
    handleGoogleSync,
    handleSubmit
  } = useProfileEditorState({
    userName,
    displayName,
    userUpi,
    userId,
    profilePicture,
    email,
    phone,
    provider,
    onProfileUpdate
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 hover:bg-slate-100 hover:text-slate-900 transition-colors" disabled={!isSessionValid}>
          <Edit2 className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">Edit Profile</DialogTitle>
        </DialogHeader>
        
        <ProfileEditorForm
          userName={userName}
          displayName={displayName}
          userUpi={userUpi}
          userId={userId}
          profilePicture={profilePicture}
          selectedAvatar={selectedAvatar}
          email={email}
          phone={phone}
          provider={provider}
          onAvatarChange={handleAvatarChange}
          onSubmit={handleSubmit}
          onGoogleSync={handleGoogleSync}
        />
        
        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="profile-edit-form"
            className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditor;
