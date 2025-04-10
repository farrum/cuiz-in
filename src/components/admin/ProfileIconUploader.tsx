
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UploadCloud, X, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export function ProfileIconUploader() {
  const { toast } = useToast();
  const [iconName, setIconName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      
      // Validate file size (max 200KB)
      if (selectedFile.size > 200 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 200KB.",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string || null);
      };
      reader.readAsDataURL(selectedFile);
      
      // Generate default name from filename
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
    
    setIsUploading(true);
    
    try {
      // Convert image to base64 string for database storage
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
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
      
      const base64String = await base64Promise;
      
      // Insert new profile icon into database
      const { data, error } = await supabase
        .from('profile_icons')
        .insert({
          id: uuidv4(),
          name: iconName.trim(),
          icon_url: base64String,
          is_active: true
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Icon uploaded successfully",
        description: "The new profile icon has been added to the database.",
      });
      
      // Reset form
      setIconName('');
      setFile(null);
      setPreviewUrl(null);
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
          disabled={!file || !iconName.trim() || isUploading}
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
      </CardContent>
    </Card>
  );
}
