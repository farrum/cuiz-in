import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Award, UserPlus, IndianRupee, ArrowRight, LogIn, Trophy, Sparkles, PartyPopper, Rocket, Zap, HelpCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import NewsTicker from '@/components/NewsTicker';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from "@/hooks/use-toast";
const Index: React.FC = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [userName, setUserName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  useEffect(() => {
    const name = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    if (name) {
      setUserName(name);
      setHasStarted(true);
    }
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode && !localStorage.getItem(`ref_used_${refCode}`)) {
      localStorage.setItem(`ref_used_${refCode}`, 'true');
      const currentPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
      localStorage.setItem(STORAGE_KEYS.USER_POINTS, (currentPoints + 10).toString());
      setTimeout(() => {
        toast({
          title: "Welcome Bonus! 🎁",
          description: "You received 10 points for using a referral link!"
        });
      }, 1000);
    }
  }, [toast]);
  const handleStartClick = () => {
    if (userName) {
      navigate('/quiz');
    } else {
      navigate('/register');
    }
  };
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem(STORAGE_KEYS.USER_NAME, userName);
      if (!localStorage.getItem(STORAGE_KEYS.USER_POINTS)) {
        localStorage.setItem(STORAGE_KEYS.USER_POINTS, '0');
      }
      setHasStarted(true);
      setShowNameInput(false);
      setTimeout(() => {
        navigate('/quiz');
      }, 500);
    }
  };
  return <main className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
      <Header />
      <NewsTicker className="mt-16" />
      
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12">
        <div className="animated-bg top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-400/20 dark:bg-blue-500/20" />
        <div className="animated-bg bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-400/20 dark:bg-purple-500/20" />
        
        <div className="max-w-3xl w-full mx-auto text-center z-10">
          <div className="mb-8 animate-fade-in">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <Trophy className="w-32 h-32 mx-auto text-yellow-500 animate-float" />
              <Sparkles className="absolute top-0 right-0 w-8 h-8 text-yellow-400" />
              <Sparkles className="absolute bottom-5 left-0 w-6 h-6 text-yellow-400" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text sm:text-5xl">
              Cuiz<span className="text-green-500">IN</span> Rewards
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-2xl">Play Quiz for Free, Earn Points, and convert them to real money. 
Invite friends to earn even more!</p>
            
            <div className="mt-6 inline-block bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium border border-green-200 dark:border-green-800">
              <span className="flex items-center">
                <Check className="w-4 h-4 mr-2" />
                No Deposits Required to Play the Quiz
              </span>
            </div>
          </div>
          
          {showNameInput ? <form onSubmit={handleNameSubmit} className="max-w-md mx-auto glass p-6 rounded-2xl animate-scale-in">
              <label className="block text-sm font-medium mb-2" htmlFor="name">
                What should we call you?
              </label>
              <input type="text" id="name" value={userName} onChange={e => setUserName(e.target.value)} placeholder="Your name" className="w-full p-3 rounded-lg border border-border bg-background mb-4" autoFocus />
              <Button type="submit" className="w-full fun-button" disabled={!userName.trim()}>
                Start Playing
              </Button>
            </form> : <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12 animate-fade-in">
              {hasStarted ? <Button size="lg" onClick={handleStartClick} className="fun-button text-lg group relative overflow-hidden">
                  Continue Playing
                  <Rocket className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button> : <>
                  <Button size="lg" onClick={() => navigate('/register')} className="fun-button text-lg group relative overflow-hidden">
                    Register
                    <UserPlus className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                  
                  <Button variant="outline" size="lg" onClick={() => navigate('/login')} className="text-lg group hover:shadow-md transition-all">
                    Login
                    <LogIn className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </>}
              
              {hasStarted && <Button variant="outline" size="lg" onClick={() => navigate('/profile')} className="text-lg hover:shadow-md transition-all">
                  View Profile
                </Button>}
            </div>}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[{
            icon: <Award className="w-12 h-12 text-blue-500" />,
            title: "Play & Earn",
            description: "Answer quiz questions correctly to earn points. The more you play, the more you earn."
          }, {
            icon: <PartyPopper className="w-12 h-12 text-purple-500" />,
            title: "Refer Friends",
            description: "Invite friends to join and earn bonus cash for each successful referral."
          }, {
            icon: <IndianRupee className="w-12 h-12 text-green-500" />,
            title: "Cash Out",
            description: "Earn more than ₹10000 per month fix income."
          }].map((feature, index) => <div key={feature.title} className="fun-card p-6 rounded-2xl" style={{
            animationDelay: `${index * 100}ms`
          }}>
                <div className="bg-white dark:bg-gray-800 w-20 h-20 mx-auto rounded-xl flex items-center justify-center mb-4 shadow-md">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>)}
          </div>
          
          <div className="mt-12">
            <Button variant="outline" size="lg" asChild className="text-lg hover:shadow-md transition-all">
              <Link to="/how-to-play">
                <HelpCircle className="mr-2 w-5 h-5" />
                How to Play
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <footer className="py-6 border-t border-border mt-auto backdrop-blur-sm bg-white/50 dark:bg-gray-900/50">
        <div className="container">
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Cuiz<span className="text-green-500">IN</span>. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>;
};
export default Index;