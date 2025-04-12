
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const ImportInfoAlert: React.FC = () => (
  <Alert>
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Image Trivia Import</AlertTitle>
    <AlertDescription>
      This will fetch text-based trivia questions and convert them to image quiz questions by 
      adding appropriate images based on the question category.
    </AlertDescription>
  </Alert>
);

export default ImportInfoAlert;
