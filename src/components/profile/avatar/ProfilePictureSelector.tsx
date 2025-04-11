
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check } from 'lucide-react';
import { useProfilePicture } from './useProfilePicture';
import { ProfileIconsList } from './ProfileIconsList';
import { ProfileImageUploader } from './ProfileImageUploader';

interface ProfilePictureSelectorProps {
  currentAvatar?: string;
  userId: string;
  onAvatarChange: (avatar: string) => void;
}

const ProfilePictureSelector: React.FC<ProfilePictureSelectorProps> = ({ 
  currentAvatar, 
  userId, 
  onAvatarChange 
}) => {
  const {
    isOpen,
    setIsOpen,
    selectedTab,
    setSelectedTab,
    selectedAvatar,
    uploading,
    uploadProgress,
    customIcons,
    getInitials,
    handleAvatarSelection,
    handleFileUpload,
    handleSave
  } = useProfilePicture(currentAvatar, userId, onAvatarChange);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-2">
          Change Profile Picture
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Picture</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="icons" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="icons">Choose Icon</TabsTrigger>
            <TabsTrigger value="upload">Upload Picture</TabsTrigger>
          </TabsList>
          
          <TabsContent value="icons" className="pt-4">
            <ProfileIconsList 
              selectedAvatar={selectedAvatar} 
              customIcons={customIcons}
              onSelectAvatar={handleAvatarSelection} 
            />
            <p className="text-xs text-muted-foreground mt-4">
              More avatar options can be added by administrators in the admin panel.
            </p>
          </TabsContent>
          
          <TabsContent value="upload" className="pt-4">
            <ProfileImageUploader 
              selectedAvatar={selectedAvatar}
              userId={userId}
              uploading={uploading}
              uploadProgress={uploadProgress}
              getInitials={getInitials}
              handleFileUpload={handleFileUpload}
            />
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={uploading || !selectedAvatar}>
            <Check className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePictureSelector;
