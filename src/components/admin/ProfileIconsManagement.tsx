
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash, Upload, Check, X, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProfileIcon {
  id: string;
  name: string;
  icon_url: string;
  created_at: string;
  is_active: boolean;
}

const ProfileIconsManagement: React.FC = () => {
  const [icons, setIcons] = useState<ProfileIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [newIconName, setNewIconName] = useState('');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchIcons();
  }, []);

  const fetchIcons = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profile_icons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setIcons(data as ProfileIcon[]);
      }
    } catch (error) {
      console.error('Error fetching profile icons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile icons',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File validation
    if (file.size > 512000) { // 500KB limit
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 500KB',
        variant: 'destructive'
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    setUploadingFile(file);
  };

  const handleIconUpload = async () => {
    if (!uploadingFile || !newIconName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide an icon name and select a file',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Generate a unique filename
      const fileExt = uploadingFile.name.split('.').pop();
      const fileName = `icon_${Date.now()}.${fileExt}`;
      const filePath = `icons/${fileName}`;

      setTimeout(() => setUploadProgress(30), 300);

      console.log('Uploading to path:', filePath);

      // Upload to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('profiles')
        .upload(filePath, uploadingFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);
      setTimeout(() => setUploadProgress(60), 500);

      // Get the public URL
      const { data: urlData } = await supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      console.log('Public URL:', urlData.publicUrl);
      setTimeout(() => setUploadProgress(80), 700);

      // Add record to the profile_icons table
      const { error, data } = await supabase
        .from('profile_icons')
        .insert({
          name: newIconName,
          icon_url: urlData.publicUrl,
          is_active: true
        })
        .select();

      if (error) {
        console.error('Database insert error:', error);
        throw new Error(`Database insert failed: ${error.message}`);
      }

      console.log('Icon record created:', data);
      setTimeout(() => setUploadProgress(100), 800);

      toast({
        title: 'Success',
        description: 'Profile icon uploaded successfully',
      });

      // Reset form and close dialog
      setNewIconName('');
      setUploadingFile(null);
      setIsUploadDialogOpen(false);
      
      // Refresh icons list
      fetchIcons();
    } catch (error) {
      console.error('Error uploading icon:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload icon. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const handleDeleteIcon = async (iconId: string) => {
    try {
      // First get the icon to find the file path
      const { data: iconData, error: fetchError } = await supabase
        .from('profile_icons')
        .select('*')
        .eq('id', iconId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete the record from the database
      const { error } = await supabase
        .from('profile_icons')
        .delete()
        .eq('id', iconId);

      if (error) throw error;
      
      // Try to delete the file from storage if it's a custom uploaded icon
      // Extract the path from the URL if it's a Supabase storage URL
      if (iconData?.icon_url && iconData.icon_url.includes('/storage/v1/object/public/profiles/')) {
        try {
          const filePathMatch = iconData.icon_url.match(/\/storage\/v1\/object\/public\/profiles\/(.+)/);
          if (filePathMatch && filePathMatch[1]) {
            const filePath = filePathMatch[1];
            await supabase.storage.from('profiles').remove([filePath]);
          }
        } catch (storageError) {
          // Log but don't fail the operation if storage removal fails
          console.error('Error removing file from storage:', storageError);
        }
      }

      toast({
        title: 'Icon deleted',
        description: 'The profile icon has been removed',
      });

      // Refresh icons list
      fetchIcons();
    } catch (error) {
      console.error('Error deleting icon:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the icon',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Profile Icons</CardTitle>
            <CardDescription>Manage custom profile icons for users</CardDescription>
          </div>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Icon
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : icons.length === 0 ? (
          <div className="text-center p-4 border rounded-md">
            <p className="text-muted-foreground">No custom icons added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {icons.map((icon) => (
              <div key={icon.id} className="relative border rounded-md p-3 flex flex-col items-center">
                <Avatar className="h-16 w-16 mb-2">
                  <AvatarImage src={icon.icon_url} alt={icon.name} />
                  <AvatarFallback>{icon.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium text-center truncate w-full">{icon.name}</p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-0 right-0 text-red-500 h-8 w-8"
                  onClick={() => handleDeleteIcon(icon.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Profile Icon</DialogTitle>
            <DialogDescription>
              Upload a new icon that users can select for their profiles.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="icon-name">Icon Name</Label>
              <Input
                id="icon-name"
                value={newIconName}
                onChange={(e) => setNewIconName(e.target.value)}
                placeholder="Enter a name for this icon"
              />
            </div>
            <div className="grid gap-2">
              <Label>Icon Image</Label>
              <div className="flex flex-col items-center gap-4 border rounded-md p-4">
                {uploadingFile ? (
                  <Avatar className="h-24 w-24">
                    <AvatarImage 
                      src={URL.createObjectURL(uploadingFile)} 
                      alt="Icon preview" 
                    />
                    <AvatarFallback>
                      {newIconName ? newIconName.substring(0, 1).toUpperCase() : 'I'}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <Label 
                  htmlFor="icon-upload" 
                  className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  {uploadingFile ? 'Change Image' : 'Upload Image'}
                </Label>
                <Input 
                  id="icon-upload" 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max 500KB.
                </p>
              </div>
            </div>
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-primary h-1 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={isUploading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleIconUpload}
              disabled={isUploading || !uploadingFile || !newIconName.trim()}
            >
              {isUploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Icon
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProfileIconsManagement;
