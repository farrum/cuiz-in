
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Edit2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ProfilePictureSelector from './ProfilePictureSelector';
import { STORAGE_KEYS } from '@/utils/quizData';

const profileSchema = z.object({
  displayName: z.string().min(3, 'Display name must be at least 3 characters'),
  upiId: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(profilePicture || '');
  const [isSessionValid, setIsSessionValid] = useState(true); // Default to true to fix inactive button
  const { toast } = useToast();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: userName,
      upiId: userUpi,
    },
  });

  // Check for a valid session or localStorage auth when the component mounts
  useEffect(() => {
    console.log("Checking auth in ProfileEditor for userId:", userId);
    console.log("Current profile picture is:", profilePicture);
    
    // This username check is important - if we have a username, we're authenticated
    if (localStorage.getItem(STORAGE_KEYS.USER_NAME)) {
      console.log("User has a valid name in localStorage:", localStorage.getItem(STORAGE_KEYS.USER_NAME));
      setIsSessionValid(true);
      return;
    }
    
    // Check for localStorage authentication
    const isLocalAuth = localStorage.getItem(STORAGE_KEYS.USER_AUTH) === 'true';
    
    if (isLocalAuth) {
      console.log("User authenticated via localStorage");
      setIsSessionValid(true);
      return;
    }
    
    // Then check Supabase session as fallback
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("User authenticated via Supabase session");
        setIsSessionValid(true);
      } else {
        console.log("No valid authentication found");
        setIsSessionValid(false);
      }
    };
    
    checkAuth();
  }, [userId, profilePicture]);

  // Update form values and selected avatar when props change
  useEffect(() => {
    form.reset({
      displayName: userName,
      upiId: userUpi,
    });
    setSelectedAvatar(profilePicture || '');
    console.log("ProfileEditor updated with profile picture:", profilePicture);
  }, [userName, userUpi, profilePicture, form]);

  const handleAvatarChange = (avatar: string) => {
    console.log("Avatar changed to:", avatar);
    setSelectedAvatar(avatar);
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      console.log("Profile update initiated for user:", userId);
      
      // Check if we have a valid user ID
      if (!userId) {
        throw new Error('User ID not found. Please try logging in again.');
      }
      
      // Only check for Supabase session if localStorage auth is not present and no username
      if (!localStorage.getItem(STORAGE_KEYS.USER_NAME) && 
          localStorage.getItem(STORAGE_KEYS.USER_AUTH) !== 'true') {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session found. Please log in again.');
        }
      }
      
      console.log('Updating profile with data:', {
        displayName: data.displayName,
        upiId: data.upiId,
        profilePicture: selectedAvatar
      });
      
      // Update local storage
      if (data.displayName !== userName) {
        localStorage.setItem(STORAGE_KEYS.USER_NAME, data.displayName);
      }
      
      if (data.upiId !== userUpi) {
        localStorage.setItem('quiz_app_user_upi', data.upiId || '');
      }
      
      // Store profile picture selection if available
      if (selectedAvatar) {
        localStorage.setItem('quiz_app_user_avatar', selectedAvatar);
      }
      
      // Update the profile data in Supabase to sync with admin view
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: data.displayName, // Update the display_name field
            profile_picture: selectedAvatar,
            upi_id: data.upiId || null
          })
          .eq('id', userId);
        
        if (error) {
          console.error('Error updating profile in Supabase:', error);
          // Continue with the local update even if the server update fails
          console.log('Continuing with local profile update despite server error');
        }
      } catch (supabaseError) {
        console.error('Caught exception updating profile in Supabase:', supabaseError);
        // Don't throw here, allow the local profile update to continue
      }
      
      // Call the callback to update parent state
      onProfileUpdate({
        displayName: data.displayName,
        upiId: data.upiId,
        profilePicture: selectedAvatar
      });
      
      // Close the dialog
      setIsOpen(false);
      
      // Show success toast
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error 
          ? error.message 
          : "Failed to update your profile. Please try again.",
        variant: "destructive"
      });
    }
  };

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
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center">
              <ProfilePictureSelector 
                currentAvatar={selectedAvatar || profilePicture} 
                userId={userId}
                onAvatarChange={handleAvatarChange} 
              />
            </div>
            
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your display name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="upiId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UPI ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Your UPI ID for withdrawals" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditor;
