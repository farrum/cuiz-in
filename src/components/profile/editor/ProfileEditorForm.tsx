
import React from 'react';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ProfilePictureSelector from '@/components/profile/avatar/ProfilePictureSelector';

const profileSchema = z.object({
  displayName: z.string().min(3, 'Display name must be at least 3 characters'),
  upiId: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditorFormProps {
  userName: string;
  userUpi: string;
  userId: string;
  profilePicture?: string;
  selectedAvatar: string;
  onAvatarChange: (avatar: string) => void;
  onSubmit: (data: ProfileFormValues) => Promise<void>;
}

export const ProfileEditorForm: React.FC<ProfileEditorFormProps> = ({
  userName,
  userUpi,
  userId,
  profilePicture,
  selectedAvatar,
  onAvatarChange,
  onSubmit
}) => {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: userName,
      upiId: userUpi,
    },
  });

  React.useEffect(() => {
    form.reset({
      displayName: userName,
      upiId: userUpi,
    });
  }, [userName, userUpi, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col items-center">
          <ProfilePictureSelector 
            currentAvatar={selectedAvatar || profilePicture} 
            userId={userId}
            onAvatarChange={onAvatarChange} 
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
      </form>
    </Form>
  );
};
