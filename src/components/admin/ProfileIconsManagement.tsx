
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, Trash2, Upload, RefreshCw, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface ProfileIcon {
  id: string;
  name: string;
  icon_url: string;
  created_at: string;
  is_active: boolean;
}

const ProfileIconsManagement: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [icons, setIcons] = useState<ProfileIcon[]>([]);
  const [iconName, setIconName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [iconToDelete, setIconToDelete] = useState<ProfileIcon | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchIcons = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_icons')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setIcons(data);
      }
    } catch (error) {
      console.error('Error fetching profile icons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile icons',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchIcons();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (500KB limit)
      if (file.size > 512000) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 500KB',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const uploadIcon = async () => {
    if (!selectedFile || !iconName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both an icon name and image',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Generate a unique file name
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `icon_${Date.now()}.${fileExt}`;
      const filePath = `profile_icons/${fileName}`;

      setTimeout(() => setUploadProgress(30), 300);

      // Upload the file to storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      setTimeout(() => setUploadProgress(60), 600);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      const iconUrl = urlData.publicUrl;

      // Insert record in the profile_icons table
      const { error: insertError } = await supabase
        .from('profile_icons')
        .insert({
          name: iconName.trim(),
          icon_url: iconUrl,
          is_active: true,
        });

      if (insertError) throw insertError;

      setTimeout(() => setUploadProgress(100), 800);

      toast({
        title: 'Success',
        description: 'Profile icon uploaded successfully',
      });

      // Reset form and refresh the icons list
      setIconName('');
      setSelectedFile(null);
      setIsAddDialogOpen(false);
      fetchIcons();
      
    } catch (error) {
      console.error('Error uploading profile icon:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload profile icon. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const confirmDeleteIcon = (icon: ProfileIcon) => {
    setIconToDelete(icon);
    setIsDeleteDialogOpen(true);
  };

  const deleteIcon = async () => {
    if (!iconToDelete) return;
    
    try {
      // First mark as inactive rather than deleting
      const { error } = await supabase
        .from('profile_icons')
        .update({ is_active: false })
        .eq('id', iconToDelete.id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Profile icon removed successfully',
      });
      
      setIsDeleteDialogOpen(false);
      fetchIcons();
      
    } catch (error) {
      console.error('Error deleting profile icon:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete profile icon',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Profile Icons</h2>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Icon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Profile Icon</DialogTitle>
              <DialogDescription>
                Upload a new profile icon for users to select. Images should be square for best results.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="icon-name">Icon Name</Label>
                <Input
                  id="icon-name"
                  placeholder="e.g., Blue Avatar"
                  value={iconName}
                  onChange={(e) => setIconName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="icon-file">Upload Image</Label>
                <div className="flex items-center gap-2">
                  {selectedFile ? (
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 p-2 border rounded truncate">
                        {selectedFile.name}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="w-full">
                      <Button variant="outline" className="w-full" type="button">
                        <Upload className="h-4 w-4 mr-2" />
                        Select Image
                      </Button>
                      <input
                        id="icon-file"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max 500KB. Square images work best.
                </p>
              </div>
            </div>
            
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
                <div 
                  className="bg-primary h-1 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={uploadIcon} disabled={isUploading || !selectedFile || !iconName.trim()}>
                {isUploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Icon
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {icons.filter(icon => icon.is_active).map((icon) => (
          <Card key={icon.id}>
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-sm font-medium truncate">{icon.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex justify-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={icon.icon_url} alt={icon.name} />
                <AvatarFallback>{icon.name.substring(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => confirmDeleteIcon(icon)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        {icons.filter(icon => icon.is_active).length === 0 && (
          <div className="col-span-full p-8 text-center text-muted-foreground">
            No custom profile icons found. Add some icons for your users to select from!
          </div>
        )}
      </div>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Profile Icon</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this profile icon? Users who have selected this icon will still see it, but it will no longer be available for new selections.
            </DialogDescription>
          </DialogHeader>
          
          {iconToDelete && (
            <div className="py-4 flex items-center justify-center">
              <Avatar className="h-16 w-16">
                <AvatarImage src={iconToDelete.icon_url} alt={iconToDelete.name} />
                <AvatarFallback>{iconToDelete.name.substring(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteIcon}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Icon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileIconsManagement;
