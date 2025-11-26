
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Edit2, Save, X } from 'lucide-react';
import { ProfileEditorForm } from './ProfileEditorForm';
import { useProfileEditorState } from './useProfileEditorState';

interface ProfileEditorProps {
  userName: string;
  userUpi: string;
  userId: string;
  profilePicture?: string;
  onProfileUpdate: (data: {
    displayName?: string;
    upiId?: string;
    profilePicture?: string;
  }) => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ 
  userName, 
  userUpi, 
  userId,
  profilePicture,
  onProfileUpdate 
}) => {
  const {
    isOpen,
    setIsOpen,
    selectedAvatar,
    isSessionValid,
    handleAvatarChange,
    handleSubmit
  } = useProfileEditorState({
    userName,
    userUpi,
    userId,
    profilePicture,
    onProfileUpdate
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8" disabled={!isSessionValid}>
          <Edit2 className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        <ProfileEditorForm
          userName={userName}
          userUpi={userUpi}
          userId={userId}
          profilePicture={profilePicture}
          selectedAvatar={selectedAvatar}
          onAvatarChange={handleAvatarChange}
          onSubmit={handleSubmit}
        />
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" form="profile-edit-form">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditor;
