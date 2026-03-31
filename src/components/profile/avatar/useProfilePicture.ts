
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';

interface CustomIcon {
  id: string;
  name: string;
  icon_url: string;
}

export const useProfilePicture = (currentAvatar: string | undefined, userId: string, onAvatarChange: (avatar: string) => void) => {
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

  useEffect(() => {
    setSelectedAvatar(currentAvatar || '');
  }, [currentAvatar]);

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

      // Check if we have a valid user ID before proceeding
      if (!userId) {
        throw new Error('User ID not found. Please try logging in again.');
      }

      // Check for authentication either through localStorage or Supabase session
      const isLocalAuth = localStorage.getItem(STORAGE_KEYS.USER_AUTH) === 'true' || 
                          !!localStorage.getItem(STORAGE_KEYS.USER_NAME);
      
      if (!isLocalAuth) {
        // Only check Supabase session if local auth is not present
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session found. Please log in to upload a profile picture.');
        }
      }

      // Generate a unique file name using user id and timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/avatars/${fileName}`;

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
        description: "Your profile picture has been uploaded"
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

  return {
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
  };
};
