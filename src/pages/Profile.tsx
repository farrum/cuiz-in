
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Pencil, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getAllBadges } from '@/utils/badgeData';
import { STORAGE_KEYS } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';

import { useAuthCheck } from '@/hooks/useAuthCheck';

const profileFormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  bio: z.string().max(160, {
    message: "Bio must not be longer than 160 characters.",
  }).optional(),
  location: z.string().optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional(),
})

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [showBadgeDetails, setShowBadgeDetails] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [totalReferredPoints, setTotalReferredPoints] = useState(0);
  
  const { isSuspended } = useAuthCheck();
  
  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  
  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    
    const fetchProfile = async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          toast({
            title: "Error",
            description: "Failed to load profile data.",
            variant: "destructive",
          });
          return;
        }
        
        if (profileData) {
          setUserName(profileData.username || '');
          setJoinDate(profileData.created_at || '');
          setProfilePicture(profileData.profile_picture || null);
          
          // Generate a simple referral code based on userId if it doesn't exist
          const generatedReferralCode = userId.substring(0, 8);
          setReferralCode(generatedReferralCode);
          setReferralLink(`${window.location.origin}/?ref=${generatedReferralCode}` || '');
        }
        
        // Use user_referrals table instead of referrals
        const { data: referralData, error: referralError } = await supabase
          .from('user_referrals')
          .select('referred_user_id')
          .eq('referrer_id', userId);
          
        if (referralError) {
          console.error('Error fetching referrals:', referralError);
        } else if (referralData) {
          setReferralCount(referralData.length);
          setTotalReferredPoints(referralData.length * 10);
        }
      } catch (error) {
        console.error('Error in fetchProfile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        });
      }
    };
    
    fetchProfile();
  }, [userId, navigate, toast]);
  
  useEffect(() => {
    const fetchBadges = async () => {
      const allBadges = getAllBadges();
      
      // Since there's no user_badges table in the database schema,
      // we'll just display all available badges for now
      // In a real implementation, you would filter based on user's earned badges
      setBadges(allBadges);
      
      // This code is commented out since the user_badges table doesn't exist
      /*
      const { data: userBadges, error } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId || '');
        
      if (error) {
        console.error('Error fetching user badges:', error);
        return;
      }
      
      const earnedBadgeIds = userBadges ? userBadges.map(badge => badge.badge_id) : [];
      
      const earnedBadges = allBadges.filter(badge => earnedBadgeIds.includes(badge.id));
      setBadges(earnedBadges);
      */
    };
    
    fetchBadges();
  }, [userId]);
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: userName,
      bio: '',
      location: '',
      website: '',
    },
    mode: "onChange",
  })
  
  const handleEditProfile = () => {
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    form.reset({
      username: userName,
      bio: '',
      location: '',
      website: '',
    });
  };
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleBadgeClick = (badge: any) => {
    setSelectedBadge(badge);
    setShowBadgeDetails(true);
  };
  
  const handleCloseBadgeDetails = () => {
    setShowBadgeDetails(false);
    setSelectedBadge(null);
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Referral Link Copied",
      description: "Your referral link has been copied to the clipboard.",
    });
  };
  
  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    try {
      const updates = {
        username: values.username,
        // bio: values.bio,
        // location: values.location,
        // website: values.website,
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
        
      if (error) {
        throw error;
      }
      
      setUserName(values.username);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, values.username);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <NewsTicker className="mt-16" />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-10">
          {/* First column - User Info */}
          <div className="flex-1">
            <Card className="h-full">
              <CardHeader className="text-center relative">
                <div className="absolute top-2 right-2">
                  <Button variant="ghost" size="icon" onClick={handleEditProfile}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mx-auto">
                  <Avatar className="w-24 h-24 mx-auto border-4 border-background">
                    <AvatarImage src={selectedImage || profilePicture || 'https://github.com/shadcn.png'} alt={userName} />
                    <AvatarFallback>{userName ? userName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle>{userName || 'User'}</CardTitle>
                <CardDescription>Player since {formatDate(joinDate)}</CardDescription>
                
                <div className="mt-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isSuspended ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                    <span className={`mr-1 w-2 h-2 rounded-full ${isSuspended ? 'bg-red-400' : 'bg-green-400'}`}></span>
                    {isSuspended ? 'Suspended' : 'Active'}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent>
                {isEditing ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us a little bit about yourself"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Where are you from?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your website" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      /> */}
                      
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                        <Button type="submit">Update Profile</Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      {/* Display user information here */}
                      <p>Username: {userName}</p>
                      {/* <p>Bio: {form.getValues().bio || 'No bio yet.'}</p>
                      <p>Location: {form.getValues().location || 'No location set.'}</p>
                      <p>Website: {form.getValues().website || 'No website set.'}</p> */}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="profile-picture">Update Profile Picture</Label>
                      <Input type="file" id="profile-picture" className="hidden" onChange={handleImageChange} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Second column - Referral Info */}
          <div className="flex-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Referral Program</CardTitle>
                <CardDescription>Share the rewards, earn together!</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="referral-code">Your Referral Link</Label>
                  <div className="flex items-center">
                    <Input id="referral-code" value={referralLink} readOnly className="cursor-not-allowed" />
                    <Button variant="outline" size="sm" className="ml-2" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Referral Stats</Label>
                  <div className="text-sm text-muted-foreground">
                    <p>Total Referrals: {referralCount}</p>
                    <p>Total Points Earned: {totalReferredPoints}</p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Badges Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Your Badges</h2>
          
          {badges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {badges.map((badge) => (
                <div 
                  key={badge.id} 
                  className="p-4 rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleBadgeClick(badge)}
                >
                  <div className="flex items-center justify-center h-16">
                    {badge.icon}
                  </div>
                  <h3 className="text-lg font-semibold mt-2">{badge.name}</h3>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">
              You haven't earned any badges yet. Keep playing to unlock more!
            </div>
          )}
        </section>
        
        {/* Badge Details Modal */}
        {showBadgeDetails && selectedBadge && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-background rounded-lg p-8 max-w-md w-full">
              <div className="flex justify-end">
                <Button variant="ghost" size="icon" onClick={handleCloseBadgeDetails}>
                  X
                </Button>
              </div>
              <div className="flex items-center justify-center h-24">
                {selectedBadge.icon}
              </div>
              <h2 className="text-2xl font-bold text-center mb-4">{selectedBadge.name}</h2>
              <p className="text-muted-foreground text-center">{selectedBadge.description}</p>
              <div className="mt-4">
                <h3 className="font-semibold">How to earn:</h3>
                <p className="text-muted-foreground">{selectedBadge.criteria.description}</p>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
