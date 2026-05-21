
import React from 'react';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ProfilePictureSelector from '@/components/profile/avatar/ProfilePictureSelector';
import { User, Mail, Shield } from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(3, 'Display name must be at least 3 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username handle can only contain letters, numbers, and underscores'),
  upiId: z.string().optional(),
  email: z.string().email('Please enter a valid email address').or(z.literal('')),
  phone: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword.length > 0) {
    return data.newPassword.length >= 6;
  }
  return true;
}, {
  message: "Password must be at least 6 characters",
  path: ["newPassword"],
}).refine((data) => {
  if (data.newPassword && data.newPassword.length > 0) {
    return data.newPassword === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditorFormProps {
  userName: string;
  displayName: string;
  userUpi: string;
  userId: string;
  profilePicture?: string;
  selectedAvatar: string;
  email?: string | null;
  phone?: string | null;
  provider?: string;
  onAvatarChange: (avatar: string) => void;
  onSubmit: (data: ProfileFormValues) => Promise<void>;
  onGoogleSync: () => Promise<void>;
}

export const ProfileEditorForm: React.FC<ProfileEditorFormProps> = ({
  userName,
  displayName,
  userUpi,
  userId,
  profilePicture,
  selectedAvatar,
  email,
  phone,
  provider = 'email',
  onAvatarChange,
  onSubmit,
  onGoogleSync
}) => {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: displayName || '',
      username: userName || '',
      upiId: userUpi || '',
      email: email || '',
      phone: phone || '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  React.useEffect(() => {
    form.reset({
      displayName: displayName || '',
      username: userName || '',
      upiId: userUpi || '',
      email: email || '',
      phone: phone || '',
      newPassword: '',
      confirmPassword: '',
    });
  }, [userName, displayName, userUpi, email, phone, form]);

  return (
    <Form {...form}>
      <form id="profile-edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100/80 p-1 rounded-xl">
            <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">
              <User className="h-4 w-4 mr-2 text-indigo-500" />
              <span className="hidden sm:inline">Profile</span>
              <span className="sm:hidden text-xs">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">
              <Mail className="h-4 w-4 mr-2 text-emerald-500" />
              <span className="hidden sm:inline">Contact</span>
              <span className="sm:hidden text-xs">Contact</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">
              <Shield className="h-4 w-4 mr-2 text-violet-500" />
              <span className="hidden sm:inline">Security</span>
              <span className="sm:hidden text-xs">Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 pt-4 outline-none focus-visible:ring-0">
            <div className="flex flex-col items-center mb-6">
              <ProfilePictureSelector 
                currentAvatar={selectedAvatar || profilePicture} 
                userId={userId}
                onAvatarChange={onAvatarChange} 
              />
              <p className="text-xs text-muted-foreground mt-2">Tap to change avatar</p>
              
              {provider === 'google' && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={onGoogleSync}
                  className="mt-4 flex items-center gap-2 border-slate-200 hover:bg-slate-50 text-xs font-semibold px-4 py-2 rounded-full shadow-sm hover:shadow transition-all duration-200"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                    <g transform="matrix(1, 0, 0, 1, 0, 0)">
                      <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.75 21.57,11.4 21.35,11.1z" fill="#4285F4" />
                      <path d="M12,20.6c2.59,0 4.77,-0.86 6.36,-2.32l-3.3,-2.58c-0.91,0.61 -2.08,0.97 -3.06,0.97 -2.36,0 -4.36,-1.59 -5.07,-3.73H3.5v2.66c1.57,3.12 4.79,5.08 8.5,5.08z" fill="#34A853" />
                      <path d="M6.93,12.94c-0.18,-0.54 -0.28,-1.12 -0.28,-1.72s0.1,-1.18 0.28,-1.72V6.84H3.5C2.88,8.08 2.53,9.5 2.53,11s0.35,2.92 0.97,4.16L6.93,12.94z" fill="#FBBC05" />
                      <path d="M12,6.12c1.41,0 2.68,0.48 3.68,1.44l2.76,-2.76C16.77,3.31 14.59,2.52 12,2.52c-3.71,0 -6.93,1.96 -8.5,5.08l3.43,2.66c0.71,-2.14 2.71,-3.74 5.07,-3.74z" fill="#EA4335" />
                    </g>
                  </svg>
                  Sync from Google
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600">Username Handle</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-muted-foreground text-sm font-semibold">@</span>
                        <Input placeholder="username" className="pl-7 bg-white/50 backdrop-blur-sm focus:bg-white transition-all duration-200" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600">Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Display Name" className="bg-white/50 backdrop-blur-sm focus:bg-white transition-all duration-200" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="upiId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-600">UPI ID for Withdrawals</FormLabel>
                  <FormControl>
                    <Input placeholder="username@upi" className="bg-white/50 backdrop-blur-sm focus:bg-white transition-all duration-200" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 pt-4 outline-none focus-visible:ring-0">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-600">Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="email@example.com" 
                      type="email"
                      disabled={provider === 'google'} 
                      className="bg-white/50 backdrop-blur-sm focus:bg-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed" 
                      {...field} 
                    />
                  </FormControl>
                  {provider === 'google' && (
                    <p className="text-[11px] text-slate-400 mt-1">Google accounts cannot modify their email address here.</p>
                  )}
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-slate-600">Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" type="tel" className="bg-white/50 backdrop-blur-sm focus:bg-white transition-all duration-200" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="security" className="space-y-4 pt-4 outline-none focus-visible:ring-0">
            {provider === 'google' ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-3">
                <div className="p-3 bg-indigo-50 text-indigo-500 rounded-full animate-pulse">
                  <Shield className="h-8 w-8" />
                </div>
                <h4 className="font-bold text-slate-700 text-sm">Security Managed by Google</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Your account is protected via Google OAuth. To update passwords or configure multi-factor authentication, please use your Google Account settings.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600">New Password</FormLabel>
                      <FormControl>
                        <Input placeholder="••••••••" type="password" className="bg-white/50 backdrop-blur-sm focus:bg-white transition-all duration-200" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-600">Confirm New Password</FormLabel>
                      <FormControl>
                        <Input placeholder="••••••••" type="password" className="bg-white/50 backdrop-blur-sm focus:bg-white transition-all duration-200" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
};
