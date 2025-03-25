
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';

interface AccountReactivationProps {
  onReactivated: () => void;
  reactivationRequested?: boolean;
  reactivationApproved?: boolean;
}

const AccountReactivation: React.FC<AccountReactivationProps> = ({ 
  onReactivated,
  reactivationRequested = false,
  reactivationApproved = false
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(reactivationRequested);
  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  
  const handleRequestReactivation = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          reactivation_requested: true,
          reactivation_requested_at: new Date().toISOString()
        })
        .eq('id', userId || '');
        
      if (error) {
        throw error;
      }
      
      setRequestSent(true);
      toast({
        title: "Reactivation Requested",
        description: "Your reactivation request has been sent. An administrator will review your request.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error requesting reactivation:', error);
      toast({
        title: "Request Failed",
        description: "Failed to send reactivation request. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // When account is already approved for reactivation
  if (reactivationApproved) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg border-green-200">
        <CardHeader className="bg-green-50">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-center">Account Reactivated!</CardTitle>
          <CardDescription className="text-center">
            Your account has been successfully reactivated.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            You'll now be redirected to continue playing.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button onClick={onReactivated} className="w-full">
            Continue to Game
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // When reactivation request is pending
  if (requestSent) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg border-orange-200">
        <CardHeader className="bg-orange-50">
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-12 w-12 text-orange-500" />
          </div>
          <CardTitle className="text-center">Reactivation Pending</CardTitle>
          <CardDescription className="text-center">
            Your reactivation request is awaiting admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Your account is currently suspended. We've received your request to reactivate your account.
            An administrator will review your request and reactivate your account soon.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <p className="text-sm text-muted-foreground italic">
            Please check back later.
          </p>
        </CardFooter>
      </Card>
    );
  }
  
  // Initial suspended state - need to request reactivation
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-red-200">
      <CardHeader className="bg-red-50">
        <div className="flex items-center justify-center mb-2">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <CardTitle className="text-center">Account Suspended</CardTitle>
        <CardDescription className="text-center">
          Your account has been suspended due to inactivity.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-center text-muted-foreground">
          Your account has been suspended because you haven't logged in for 5 or more days.
          To continue playing, please request account reactivation. An administrator will review your request.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center pb-6">
        <Button 
          onClick={handleRequestReactivation}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Sending Request..." : "Request Reactivation"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AccountReactivation;
