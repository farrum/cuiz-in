
import React, { useState, useEffect } from 'react';
import { useQuizTypes, QuizChallenge } from '@/hooks/quiz/useQuizTypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Users, Trophy, Clock, AlertCircle, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const SocialChallenges: React.FC = () => {
  const { getChallenges, sendChallenge } = useQuizTypes();
  const [challenges, setChallenges] = useState<QuizChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewChallengeDialog, setShowNewChallengeDialog] = useState(false);
  const [username, setUsername] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadChallenges = async () => {
      setIsLoading(true);
      const userChallenges = await getChallenges();
      setChallenges(userChallenges);
      setIsLoading(false);
    };
    
    loadChallenges();
  }, []);
  
  const handleSendChallenge = async () => {
    if (!username.trim()) return;
    
    setIsSending(true);
    
    try {
      // Find user by username
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();
        
      if (userError || !userData) {
        toast({
          title: "User not found",
          description: "Please enter a valid username",
          variant: "destructive"
        });
        setIsSending(false);
        return;
      }
      
      // Get random questions for the challenge
      const { data: questionData } = await supabase
        .from('quiz_questions')
        .select('id')
        .limit(5);
        
      if (!questionData || questionData.length < 5) {
        toast({
          title: "Could not create challenge",
          description: "Not enough quiz questions available",
          variant: "destructive"
        });
        setIsSending(false);
        return;
      }
      
      const questionIds = questionData.map(q => q.id);
      
      // Send the challenge
      const result = await sendChallenge(userData.id, questionIds);
      
      if (result.success) {
        toast({
          title: "Challenge sent!",
          description: `${username} has been challenged to a quiz duel.`,
        });
        setShowNewChallengeDialog(false);
        
        // Refresh challenges list
        const updatedChallenges = await getChallenges();
        setChallenges(updatedChallenges);
      } else {
        toast({
          title: "Failed to send challenge",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Error sending challenge:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleAcceptChallenge = async (challengeId: string) => {
    // Update challenge status
    await supabase
      .from('user_challenges')
      .update({ status: 'accepted' })
      .eq('id', challengeId);
      
    // Navigate to the challenge
    navigate(`/challenge/${challengeId}`);
  };
  
  const handleDeclineChallenge = async (challengeId: string) => {
    await supabase
      .from('user_challenges')
      .update({ status: 'declined' })
      .eq('id', challengeId);
      
    // Refresh challenges list
    const updatedChallenges = await getChallenges();
    setChallenges(updatedChallenges);
    
    toast({
      title: "Challenge declined",
      description: "You have declined the challenge"
    });
  };
  
  const renderChallengeStatus = (challenge: QuizChallenge) => {
    switch (challenge.status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Accepted</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Completed</Badge>;
      case 'declined':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Declined</Badge>;
      default:
        return null;
    }
  };
  
  const userId = localStorage.getItem('quiz_app_user_id');
  
  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Social Challenges
              </CardTitle>
              <CardDescription>Challenge friends to quiz duels</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowNewChallengeDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              New Challenge
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Loading challenges...</p>
            </div>
          ) : challenges.length > 0 ? (
            <div className="space-y-3">
              {challenges.map(challenge => (
                <div 
                  key={challenge.id} 
                  className="border rounded-md p-3 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">
                      {challenge.challengerId === userId ? 
                        `You challenged ${challenge.recipientName}` : 
                        `${challenge.challengerName} challenged you`}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(challenge.createdAt).toLocaleDateString()}
                    </div>
                    <div className="mt-1">
                      {renderChallengeStatus(challenge)}
                    </div>
                  </div>
                  
                  {challenge.recipientId === userId && challenge.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeclineChallenge(challenge.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleAcceptChallenge(challenge.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  )}
                  
                  {challenge.status === 'completed' && challenge.score && (
                    <div className="text-sm">
                      <div className="font-medium">Results:</div>
                      <div>{challenge.challengerName}: {challenge.score.challenger} pts</div>
                      <div>{challenge.recipientName}: {challenge.score.recipient} pts</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-md bg-muted/20">
              <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-medium mb-1">No challenges yet</h3>
              <p className="text-sm text-muted-foreground">
                Create a new challenge or wait for someone to challenge you
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="pt-2">
          <Button variant="outline" onClick={() => navigate('/quiz/social')} className="w-full">
            <Trophy className="h-4 w-4 mr-2" />
            View All Social Features
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={showNewChallengeDialog} onOpenChange={setShowNewChallengeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Challenge</DialogTitle>
            <DialogDescription>
              Challenge another user to a quiz duel. Enter their username below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewChallengeDialog(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendChallenge} 
              disabled={!username.trim() || isSending}
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Challenge
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SocialChallenges;
