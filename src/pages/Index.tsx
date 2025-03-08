
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, UserPlus, DollarSign, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from "@/hooks/use-toast";

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  
  useEffect(() => {
    const name = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    if (name) {
      setUserName(name);
      setHasStarted(true);
    }
    
    // If a referral code is in the URL, award bonus points
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode && !localStorage.getItem(`ref_used_${refCode}`)) {
      // Mark referral as used
      localStorage.setItem(`ref_used_${refCode}`, 'true');
      
      // Add 10 bonus points for using a referral link
      const currentPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
      localStorage.setItem(STORAGE_KEYS.USER_POINTS, (currentPoints + 10).toString());
      
      // Show welcome toast with bonus
      setTimeout(() => {
        toast({
          title: "Welcome Bonus!",
          description: "You received 10 points for using a referral link!",
        });
      }, 1000);
    }
  }, [toast]);
  
  const handleStartClick = () => {
    if (userName) {
      navigate('/quiz');
    } else {
      setShowNameInput(true);
    }
  };
  
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem(STORAGE_KEYS.USER_NAME, userName);
      
      // Initialize points if first time
      if (!localStorage.getItem(STORAGE_KEYS.USER_POINTS)) {
        localStorage.setItem(STORAGE_KEYS.USER_POINTS, '0');
      }
      
      setHasStarted(true);
      setShowNameInput(false);
      
      // Navigate to quiz after a brief delay
      setTimeout(() => {
        navigate('/quiz');
      }, 500);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12">
        {/* Animated backgrounds */}
        <div className="animated-bg top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary/20" />
        <div className="animated-bg bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/20" />
        
        <div className="max-w-3xl w-full mx-auto text-center z-10">
          <div className="mb-8 animate-fade-in">
            <Award className="w-20 h-20 mx-auto mb-6 text-primary animate-float" />
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              QuizPoints Rewards
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Play quizzes, earn points, and convert them to real money. 
              Invite friends to earn even more!
            </p>
          </div>
          
          {showNameInput ? (
            <form 
              onSubmit={handleNameSubmit} 
              className="max-w-md mx-auto glass p-6 rounded-2xl animate-scale-in"
            >
              <label className="block text-sm font-medium mb-2" htmlFor="name">
                What should we call you?
              </label>
              <input
                type="text"
                id="name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
                className="w-full p-3 rounded-lg border border-border bg-background mb-4"
                autoFocus
              />
              <Button 
                type="submit" 
                className="w-full btn-shine" 
                disabled={!userName.trim()}
              >
                Start Playing
              </Button>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12 animate-fade-in">
              <Button 
                size="lg" 
                onClick={handleStartClick}
                className="btn-shine text-lg group"
              >
                {hasStarted ? 'Continue Playing' : 'Start Playing'}
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              
              {hasStarted && (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/profile')}
                  className="text-lg"
                >
                  View Profile
                </Button>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              {
                icon: <Award className="w-10 h-10 text-primary" />,
                title: "Play & Earn",
                description: "Answer quiz questions correctly to earn points. The more you play, the more you earn."
              },
              {
                icon: <UserPlus className="w-10 h-10 text-primary" />,
                title: "Refer Friends",
                description: "Invite friends to join and earn bonus points for each successful referral."
              },
              {
                icon: <DollarSign className="w-10 h-10 text-primary" />,
                title: "Cash Out",
                description: "Convert your points to real money. Every 100 points equals $1.00 ready for withdrawal."
              }
            ].map((feature, index) => (
              <div 
                key={feature.title}
                className="glass p-6 rounded-2xl"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="bg-primary/10 w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <footer className="py-6 border-t border-border mt-auto">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} QuizPoints. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
};

export default Index;
