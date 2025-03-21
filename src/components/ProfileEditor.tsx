
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  const [isSessionValid, setIsSessionValid] = useState(false);
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
    const checkAuth = async () => {
      // First check localStorage authentication
      const isLocalAuth = localStorage.getItem(STORAGE_KEYS.USER_AUTH) === 'true';
      
      if (isLocalAuth) {
        console.log("User authenticated via localStorage");
        setIsSessionValid(true);
        return;
      }
      
      // Then check Supabase session
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
  }, []);

  // Update form values when props change
  useEffect(() => {
    form.reset({
      displayName: userName,
      upiId: userUpi,
    });
    setSelectedAvatar(profilePicture || '');
  }, [userName, userUpi, profilePicture, form]);

  const handleAvatarChange = (avatar: string) => {
    setSelectedAvatar(avatar);
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // Only check for Supabase session if localStorage auth is not present
      if (localStorage.getItem(STORAGE_KEYS.USER_AUTH) !== 'true') {
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
        localStorage.setItem('quiz_app_user_name', data.displayName);
      }
      
      if (data.upiId !== userUpi) {
        localStorage.setItem('quiz_app_user_upi', data.upiId || '');
      }
      
      // Store profile picture selection if available
      if (selectedAvatar) {
        localStorage.setItem('quiz_app_user_avatar', selectedAvatar);
      }
      
      // Update the profile data in Supabase to sync with admin view
      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.displayName,
          profile_picture: selectedAvatar,
          upi_id: data.upiId || null
        })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating profile in Supabase:', error);
        throw error;
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
        description: "Your profile has been successfully updated.",
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

  if (!isSessionValid) {
    return (
      <Button variant="ghost" size="sm" className="h-8" disabled>
        <Edit2 className="h-4 w-4 mr-2" />
        Edit
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8">
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
            
            <div className="flex justify-end gap-2">
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
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditor;
