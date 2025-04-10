
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UploadCloud, X, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';

export function ProfileIconUploader() {
  const { toast } = useToast();
  const [iconName, setIconName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status when component mounts
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // First check if admin auth is in local storage
        const isAdminAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
        
        if (isAdminAuth) {
          setIsAdmin(true);
          return;
        }
        
        // If not in localStorage, check session
        const { data } = await supabase.auth.getSession();
        
        if (data?.session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', data.session.user.id)
            .single();
            
          if (profile?.is_admin) {
            setIsAdmin(true);
            localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdminStatus();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      
      if (selectedFile.size > 200 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 200KB.",
          variant: "destructive"
        });
        return;
      }
      
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string || null);
      };
      reader.readAsDataURL(selectedFile);
      
      // Set a default icon name based on file if not already set
      if (!iconName) {
        const baseName = selectedFile.name.split('.')[0];
        setIconName(baseName);
      }
    }
  };
  
  const clearSelection = () => {
    setFile(null);
    setPreviewUrl(null);
  };
  
  const handleUpload = async () => {
    if (!file || !iconName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a name and select an image.",
        variant: "destructive"
      });
      return;
    }
    
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "You must be an administrator to upload profile icons.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Convert file to base64
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // First try using the admin RPC function (most reliable method)
      let success = false;
      
      try {
        const { error: rpcError } = await supabase
          .rpc('admin_insert_profile_icon', {
            icon_name: iconName.trim(),
            icon_url: base64String,
            is_active: true
          });
          
        if (!rpcError) {
          success = true;
        } else {
          console.error('RPC insert error:', rpcError);
          
          // If RPC fails with "Invalid JWT", the user isn't properly authenticated
          if (rpcError.message.includes('JWT')) {
            throw new Error('Admin authentication required. Please log out and log back in as administrator.');
          }
        }
      } catch (rpcError: any) {
        console.error('RPC insert failed:', rpcError);
      }
      
      // If RPC method failed, try direct insertion since we've already verified admin status locally
      if (!success) {
        try {
          const { error: directError } = await supabase
            .from('profile_icons')
            .insert({
              name: iconName.trim(),
              icon_url: base64String,
              is_active: true
            });
            
          if (!directError) {
            success = true;
          } else {
            console.error('Direct insert error:', directError);
            throw directError;
          }
        } catch (directError: any) {
          console.error('Direct insert exception:', directError);
          throw directError;
        }
      }
      
      // If successful, show toast and reset form
      if (success) {
        toast({
          title: "Icon uploaded successfully",
          description: "The new profile icon has been added.",
        });
        
        setIconName('');
        setFile(null);
        setPreviewUrl(null);
      } else {
        throw new Error('Failed to upload profile icon. Please try refreshing the page and logging in again.');
      }
    } catch (error: any) {
      console.error('Error uploading profile icon:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload profile icon.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Profile Icon</CardTitle>
        <CardDescription>
          Add new profile icons directly to the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="icon-name">Icon Name</Label>
          <Input
            id="icon-name"
            placeholder="Enter icon name"
            value={iconName}
            onChange={(e) => setIconName(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="icon-file">Icon Image (PNG, JPG, SVG - max 200KB)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="icon-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="flex-1"
            />
            {file && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {previewUrl && (
          <div className="border rounded p-4 flex justify-center">
            <img 
              src={previewUrl} 
              alt="Icon preview" 
              className="max-h-24 object-contain"
            />
          </div>
        )}
        
        <Button 
          onClick={handleUpload}
          disabled={!file || !iconName.trim() || isUploading || !isAdmin}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload Icon
            </>
          )}
        </Button>
        
        {!isAdmin && (
          <div className="text-sm text-destructive mt-2">
            You must be logged in as an administrator to upload icons.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
