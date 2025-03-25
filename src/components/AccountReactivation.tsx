
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { reactivateUserAccount } from '@/utils/accountSuspension';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';

interface AccountReactivationProps {
  onReactivated: () => void;
}

const AccountReactivation: React.FC<AccountReactivationProps> = ({ onReactivated }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isReactivated, setIsReactivated] = useState(false);
  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  
  const handleReactivateAccount = async () => {
    setIsLoading(true);
    
    try {
      const result = await reactivateUserAccount(userId || '');
      
      if (result.success) {
        setIsReactivated(true);
        toast({
          title: "Account Reactivated",
          description: "Your account has been successfully reactivated. You can now continue playing.",
          variant: "default",
        });
        
        // Trigger callback after a short delay to show success state
        setTimeout(() => {
          onReactivated();
        }, 1500);
      } else {
        toast({
          title: "Reactivation Failed",
          description: result.error || "Failed to reactivate your account. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error reactivating account:', error);
      toast({
        title: "Reactivation Failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-red-200">
      <CardHeader className={isReactivated ? "bg-green-50" : "bg-red-50"}>
        <div className="flex items-center justify-center mb-2">
          {isReactivated ? (
            <CheckCircle className="h-12 w-12 text-green-500" />
          ) : (
            <AlertCircle className="h-12 w-12 text-red-500" />
          )}
        </div>
        <CardTitle className="text-center">
          {isReactivated ? "Account Reactivated!" : "Account Suspended"}
        </CardTitle>
        <CardDescription className="text-center">
          {isReactivated 
            ? "Your account has been successfully reactivated." 
            : "Your account has been suspended due to inactivity."}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isReactivated ? (
          <p className="text-center text-muted-foreground">
            You'll now be redirected to continue playing.
          </p>
        ) : (
          <p className="text-center text-muted-foreground">
            Your account has been suspended because you haven't logged in for 5 or more days.
            To continue playing, please reactivate your account.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-center pb-6">
        {!isReactivated && (
          <Button 
            onClick={handleReactivateAccount}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Reactivating..." : "Reactivate Account"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AccountReactivation;
