
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, RefreshCw } from 'lucide-react';

interface ProfileImageUploaderProps {
  selectedAvatar: string;
  userId: string;
  uploading: boolean;
  uploadProgress: number;
  getInitials: (name: string) => string;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
  selectedAvatar,
  userId,
  uploading,
  uploadProgress,
  getInitials,
  handleFileUpload
}) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24 border-2 border-muted">
        {selectedAvatar && selectedAvatar.startsWith('http') ? (
          <AvatarImage src={selectedAvatar} alt="Uploaded profile picture" />
        ) : (
          <AvatarFallback className="text-2xl font-semibold">
            {getInitials(userId)}
          </AvatarFallback>
        )}
      </Avatar>
      
      <label className="w-full cursor-pointer">
        <div className="flex flex-col items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            disabled={uploading}
            onClick={() => document.getElementById('profile-upload-input')?.click()}
          >
            {uploading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {uploading ? "Uploading..." : "Upload Image"}
          </Button>
          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-primary h-1 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 500KB.</p>
        </div>
        <input 
          id="profile-upload-input"
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileUpload}
          disabled={uploading}
        />
      </label>
    </div>
  );
};
