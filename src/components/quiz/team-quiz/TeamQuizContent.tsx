
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserPlus, UserCheck, MessageSquare, Clock } from 'lucide-react';
import { QuizQuestion } from '@/utils/types';
import QuizCard from '@/components/QuizCard';
import ImageQuizContent from '@/components/quiz/ImageQuizContent';

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  points: number;
  isReady: boolean;
}

interface TeamQuizContentProps {
  question: QuizQuestion | null;
  isLoading: boolean;
  onQuestionComplete: (isCorrect: boolean, selectedAnswer: string) => void;
  teamSize: number;
}

const TeamQuizContent: React.FC<TeamQuizContentProps> = ({
  question,
  isLoading,
  onQuestionComplete,
  teamSize = 2
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'You', avatar: '', points: 0, isReady: true },
  ]);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{id: string, sender: string, message: string}>>([]);
  const [message, setMessage] = useState<string>('');
  const [waitingForTeam, setWaitingForTeam] = useState<boolean>(teamMembers.length < teamSize);
  const [waitingForAnswers, setWaitingForAnswers] = useState<boolean>(false);
  
  // Generate a random invite code on component mount
  useEffect(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteCode(code);
  }, []);

  // Simulate team members joining (for demo purposes)
  useEffect(() => {
    if (teamMembers.length < teamSize) {
      const timer = setTimeout(() => {
        const newMember: TeamMember = {
          id: `${teamMembers.length + 1}`,
          name: `Team Member ${teamMembers.length}`,
          avatar: '',
          points: 0,
          isReady: true
        };
        
        setTeamMembers(prev => [...prev, newMember]);
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'System',
          message: `${newMember.name} has joined the team!`
        }]);
        
        if (teamMembers.length + 1 >= teamSize) {
          setWaitingForTeam(false);
          setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'System',
            message: 'Team is complete! Let\'s start the quiz.'
          }]);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [teamMembers.length, teamSize]);

  const handleSendMessage = () => {
    if (message.trim()) {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'You',
        message: message.trim()
      }]);
      setMessage('');
      
      // Simulate team member response
      setTimeout(() => {
        const randomMember = teamMembers.find(m => m.id !== '1');
        if (randomMember) {
          setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: randomMember.name,
            message: 'I think the answer is option A or B.'
          }]);
        }
      }, 1500);
    }
  };

  const handleMemberReady = (memberId: string) => {
    setTeamMembers(prev => 
      prev.map(member => 
        member.id === memberId ? { ...member, isReady: true } : member
      )
    );
    
    // Check if all members are ready
    const allReady = teamMembers.every(member => member.isReady);
    if (allReady) {
      setWaitingForAnswers(false);
    }
  };

  const handleTeamQuestionComplete = (isCorrect: boolean, selectedAnswer: string) => {
    // Simulate team members' responses
    setWaitingForAnswers(true);
    
    // Simulate team members getting ready one by one
    teamMembers.forEach((member, index) => {
      if (member.id !== '1') { // Skip the current user
        setTimeout(() => {
          handleMemberReady(member.id);
          
          // Add team chat message
          setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: member.name,
            message: isCorrect 
              ? 'Great job, that was correct!' 
              : 'I think we made a mistake there.'
          }]);
          
          // If this is the last member, proceed with question completion
          if (index === teamMembers.length - 1) {
            setTimeout(() => {
              onQuestionComplete(isCorrect, selectedAnswer);
              setWaitingForAnswers(false);
            }, 1000);
          }
        }, (index + 1) * 1500);
      }
    });
  };

  if (waitingForTeam) {
    return (
      <Card className="quiz-card fun-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Quiz Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="mx-auto bg-primary/10 rounded-full p-8 w-32 h-32 flex items-center justify-center">
            <Users className="h-12 w-12 text-primary" />
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-2">Waiting for team members</h3>
            <p className="text-muted-foreground">Share this invite code with your friends:</p>
            <div className="mt-2 text-xl font-mono bg-secondary p-3 rounded-md">
              {inviteCode}
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>Y</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">You</p>
                  <p className="text-xs text-muted-foreground">Team Captain</p>
                </div>
              </div>
              <UserCheck className="h-5 w-5 text-green-500" />
            </div>
            
            {Array(teamSize - 1).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-dashed">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-muted-foreground">Waiting for player {i + 2}</p>
                  </div>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => setWaitingForTeam(false)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add AI Team Members
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="quiz-card animate-pulse">
        <CardHeader>
          <div className="h-7 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-40 bg-muted rounded"></div>
          <div className="space-y-2">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!question) {
    return (
      <Card className="quiz-card">
        <CardContent className="p-6 text-center">
          <p>No questions available. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        {question?.questionType === 'image' ? (
          <ImageQuizContent
            question={question}
            onComplete={handleTeamQuestionComplete}
            isChallenge={false}
          />
        ) : (
          <QuizCard
            question={question}
            onComplete={handleTeamQuestionComplete}
            isChallenge={false}
          />
        )}
      </div>
      
      <div className="flex flex-col h-full">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team ({teamMembers.length}/{teamSize})
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-hidden flex flex-col">
            {/* Team Members */}
            <div className="mb-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                      {member.avatar && <AvatarImage src={member.avatar} />}
                    </Avatar>
                    <span>{member.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">{member.points} pts</span>
                    {waitingForAnswers && member.id !== '1' && !member.isReady ? (
                      <Clock className="h-4 w-4 text-amber-500 ml-2 animate-pulse" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-green-500 ml-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chat Messages */}
            <div className="border rounded-md p-2 flex-1 overflow-y-auto mb-4 bg-secondary/30">
              <div className="space-y-2">
                {chatMessages.map((chat) => (
                  <div key={chat.id} className={`flex ${chat.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-lg px-3 py-1 max-w-[80%] ${
                      chat.sender === 'You' ? 'bg-primary text-primary-foreground' : 
                      chat.sender === 'System' ? 'bg-muted text-center w-full italic text-sm' : 'bg-secondary'
                    }`}>
                      {chat.sender !== 'You' && chat.sender !== 'System' && (
                        <div className="text-xs font-medium text-muted-foreground">{chat.sender}</div>
                      )}
                      <p className="text-sm">{chat.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Chat with your team..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button size="sm" onClick={handleSendMessage}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamQuizContent;
