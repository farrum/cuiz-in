
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading attendance data..." 
}) => {
  return (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-3">{message}</span>
    </div>
  );
};

export default LoadingState;
