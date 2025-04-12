
import React from 'react';
import { Check } from 'lucide-react';

const HowToEarnSection: React.FC = () => {
  return (
    <div className="mt-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
      <h2 className="text-3xl font-bold mb-6">How to Earn Money Playing CuizIN</h2>
      <p className="text-lg text-muted-foreground mb-8">
        Turn your knowledge into rewards! Join thousands of players who are already earning real money through our engaging quiz platform.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold mb-4">Quick Guide to Success</h3>
          <ol className="space-y-4 text-left">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">1</span>
              <div>
                <p className="font-medium">Sign Up & Get Started</p>
                <p className="text-muted-foreground">Create your account and receive welcome bonus points</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">2</span>
              <div>
                <p className="font-medium">Play Daily Quizzes</p>
                <p className="text-muted-foreground">Answer questions correctly to earn points and build streaks</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">3</span>
              <div>
                <p className="font-medium">Complete Challenges</p>
                <p className="text-muted-foreground">Participate in daily challenges for bonus points</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">4</span>
              <div>
                <p className="font-medium">Convert Points to Cash</p>
                <p className="text-muted-foreground">Redeem your earned points for real money rewards</p>
              </div>
            </li>
          </ol>
        </div>
        
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold mb-4">Earning Opportunities</h3>
          <div className="space-y-4">
            <div className="bg-white/80 dark:bg-gray-700/80 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Daily Login Rewards</h4>
              <p className="text-sm text-muted-foreground">Earn bonus points just by logging in daily</p>
            </div>
            <div className="bg-white/80 dark:bg-gray-700/80 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Referral Program</h4>
              <p className="text-sm text-muted-foreground">Invite friends and earn extra points for each referral</p>
            </div>
            <div className="bg-white/80 dark:bg-gray-700/80 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Achievement Rewards</h4>
              <p className="text-sm text-muted-foreground">Unlock badges and earn special bonuses</p>
            </div>
            <div className="bg-white/80 dark:bg-gray-700/80 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Monthly Rankings</h4>
              <p className="text-sm text-muted-foreground">Top players receive additional cash rewards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToEarnSection;
