
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LogIn, Rocket, Trophy, Sparkles, Check } from 'lucide-react';
import NameInputForm from './NameInputForm';

interface HeroSectionProps {
  userName: string;
  hasStarted: boolean;
  showNameInput: boolean;
  isLoggedIn: boolean;
  handleStartClick: () => void;
  navigateToRegister: () => void;
  navigateToLogin: () => void;
  navigateToProfile: () => void;
  handleNameSubmit: (e: React.FormEvent) => void;
  setUserName: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  userName,
  hasStarted,
  showNameInput,
  isLoggedIn,
  handleStartClick,
  navigateToRegister,
  navigateToLogin,
  navigateToProfile,
  handleNameSubmit,
  setUserName
}) => {
  return (
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
        
        <div className="mt-6 inline-block text-green-800 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium border border-green-200 dark:border-green-800 bg-teal-300">
          <span className="flex items-center text-2xl text-red-600">
            <Check className="w-4 h-4 mr-2" />
            No Deposits Required to Play the Quiz
          </span>
        </div>
      </div>
      
      {showNameInput ? (
        <NameInputForm 
          userName={userName} 
          onChange={setUserName}
          onSubmit={handleNameSubmit}
        />
      ) : (
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12 animate-fade-in">
          {isLoggedIn || hasStarted ? (
            <Button size="lg" onClick={handleStartClick} className="fun-button text-lg group relative overflow-hidden">
              Continue Playing
              <Rocket className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          ) : (
            <>
              <Button size="lg" onClick={navigateToRegister} className="fun-button text-lg group relative overflow-hidden">
                Register
                <UserPlus className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <Button variant="outline" size="lg" onClick={navigateToLogin} className="text-lg group hover:shadow-md transition-all">
                Login
                <LogIn className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </>
          )}
          
          {isLoggedIn && (
            <Button variant="outline" size="lg" onClick={navigateToProfile} className="text-lg hover:shadow-md transition-all">
              View Profile
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default HeroSection;
