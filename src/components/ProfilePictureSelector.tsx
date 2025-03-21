
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRound, Upload, Check, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// These are the default avatars, more can be added via the Admin interface
const DEFAULT_AVATARS = [
  { name: 'Person', icon: 'user-round' },
  { name: 'Smile', icon: 'smile' },
  { name: 'Robot', icon: 'robot' },
  { name: 'Graduate', icon: 'graduation-cap' },
  { name: 'Award', icon: 'award' },
];

interface CustomIcon {
  id: string;
  name: string;
  icon_url: string;
}

interface ProfilePictureSelectorProps {
  currentAvatar?: string;
  userId: string;
  onAvatarChange: (avatar: string) => void;
}

const ProfilePictureSelector = ({ currentAvatar, userId, onAvatarChange }: ProfilePictureSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('icons');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || '');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [customIcons, setCustomIcons] = useState<CustomIcon[]>([]);
  const { toast } = useToast();

  // Fetch custom icons from Supabase
  useEffect(() => {
    const fetchCustomIcons = async () => {
      try {
        const { data, error } = await supabase
          .from('profile_icons')
          .select('*')
          .eq('is_active', true);
          
        if (error) {
          console.error('Error fetching custom icons:', error);
          return;
        }
        
        if (data) {
          setCustomIcons(data as CustomIcon[]);
        }
      } catch (error) {
        console.error('Failed to fetch custom icons:', error);
      }
    };

    fetchCustomIcons();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.substring(0, 1).toUpperCase();
  };

  const handleAvatarSelection = (avatar: string) => {
    setSelectedAvatar(avatar);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File validation
    if (file.size > 512000) { // 500KB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 500KB",
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);

      // Check for active session before proceeding
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session found. Please log in to upload a profile picture.');
      }

      // Generate a unique file name using user id and timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      setTimeout(() => setUploadProgress(30), 300);

      // Upload to supabase
      const { error } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (error) throw error;

      setTimeout(() => setUploadProgress(70), 600);

      // Get the public URL
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      setTimeout(() => setUploadProgress(100), 800);

      // Update the avatar selection
      const avatarUrl = data.publicUrl;
      setSelectedAvatar(avatarUrl);
      
      toast({
        title: "Upload successful",
        description: "Your profile picture has been uploaded",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const handleSave = () => {
    onAvatarChange(selectedAvatar);
    setIsOpen(false);
  };

  const renderAvatarIcon = (iconName: string) => {
    switch (iconName) {
      case 'user-round':
        return <UserRound className="h-full w-full p-4" />;
      case 'smile':
        return <span className="text-3xl">😊</span>;
      case 'robot':
        return <span className="text-3xl">🤖</span>;
      case 'graduation-cap':
        return <span className="text-3xl">🎓</span>;
      case 'award':
        return <span className="text-3xl">🏆</span>;
      default:
        return <UserRound className="h-full w-full p-4" />;
    }
  };

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
            <div className="grid grid-cols-5 gap-4">
              {DEFAULT_AVATARS.map((avatar) => (
                <div 
                  key={avatar.icon} 
                  className={`cursor-pointer rounded-md border p-2 flex items-center justify-center h-16 ${
                    selectedAvatar === avatar.icon ? 'border-primary ring-2 ring-primary' : 'border-border'
                  }`}
                  onClick={() => handleAvatarSelection(avatar.icon)}
                >
                  {renderAvatarIcon(avatar.icon)}
                </div>
              ))}
              
              {customIcons.map((icon) => (
                <div 
                  key={icon.id} 
                  className={`cursor-pointer rounded-md border p-2 flex items-center justify-center h-16 ${
                    selectedAvatar === icon.icon_url ? 'border-primary ring-2 ring-primary' : 'border-border'
                  }`}
                  onClick={() => handleAvatarSelection(icon.icon_url)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={icon.icon_url} alt={icon.name} />
                    <AvatarFallback>{icon.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              More avatar options can be added by administrators in the admin panel.
            </p>
          </TabsContent>
          
          <TabsContent value="upload" className="pt-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24 border-2 border-muted">
                {selectedAvatar && selectedAvatar.startsWith('http') ? (
                  <AvatarImage src={selectedAvatar} alt="Uploaded profile picture" />
                ) : (
                  <AvatarFallback className="text-2xl font-semibold">
                    {getInitials(userId)}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <label className="w-full cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    disabled={uploading}
                    onClick={() => document.getElementById('profile-upload-input')?.click()}
                  >
                    {uploading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {uploading ? "Uploading..." : "Upload Image"}
                  </Button>
                  {uploadProgress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-primary h-1 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 500KB.</p>
                </div>
                <input 
                  id="profile-upload-input"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
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
