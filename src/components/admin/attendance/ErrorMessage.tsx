
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  error: string;
  onDismiss: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onDismiss }) => {
  return (
    <div className="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-950 dark:text-red-400">
      <AlertCircle className="flex-shrink-0 inline w-4 h-4 mr-2" />
      <span>{error}</span>
      <Button 
        variant="outline" 
        size="sm" 
        className="ml-auto"
        onClick={onDismiss}
      >
        Dismiss
      </Button>
    </div>
  );
};

export default ErrorMessage;
