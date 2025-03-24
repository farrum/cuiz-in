import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard, Trophy, IndianRupee, Check, Calendar, HelpCircle, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MotivationalCharacter from '@/components/MotivationalCharacter';

const HowToPlay: React.FC = () => {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-12 flex-1">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            How to Play Cuiz<span className="text-green-500">IN</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Easy steps to start earning rewards by playing quizzes
          </p>
          
          <div className="mt-6 flex justify-center">
            <MotivationalCharacter 
              mood="happy" 
              message="Let me guide you through how CuizIN works!"
              showMessage={true}
            />
          </div>
        </div>
        
        <div className="grid gap-8 mb-12">
          {[
            {
              icon: <Check className="w-8 h-8 text-green-500" />,
              title: "No Deposits Required",
              description: "CuizIN is completely free to play. You never need to deposit any money to start earning rewards."
            },
            {
              icon: <Trophy className="w-8 h-8 text-yellow-500" />,
              title: "Answer Quiz Questions",
              description: "Play daily quizzes and answer questions correctly to earn points. Each correct answer gives you points!"
            },
            {
              icon: <Gift className="w-8 h-8 text-purple-500" />,
              title: "Refer Friends, Earn Cash",
              description: "Invite your friends to join CuizIN and earn ₹500 for each friend that signs up and plays. Become a Team Leader with 10+ referrals and earn monthly rewards!"
            },
            {
              icon: <IndianRupee className="w-8 h-8 text-green-500" />,
              title: "Convert Points to Cash",
              description: "1.5 points = ₹1.00. Convert your points to real money and withdraw it to your bank account or UPI."
            },
            {
              icon: <Calendar className="w-8 h-8 text-blue-500" />,
              title: "Monthly Revenue",
              description: "Earn fixed revenue plus bonuses every month by maintaining active referrals and regular gameplay."
            },
          ].map((step, index) => (
            <div key={index} className="quiz-card flex gap-4 p-6 hover:shadow-md transition-shadow">
              <div className="bg-white dark:bg-gray-800 rounded-full p-3 h-fit">
                {step.icon}
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <CreditCard className="mr-2 h-6 w-6 text-green-600 dark:text-green-400" />
            Payment Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">When do I get paid?</h3>
              <p className="text-muted-foreground">
                You can request a withdrawal anytime after reaching the minimum threshold of ₹8000. Payments are processed within 3-5 business days.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-lg">Payment Methods</h3>
              <p className="text-muted-foreground">
                We support payments via UPI, bank transfers, and popular digital wallets. You'll need to provide valid payment details during the withdrawal process.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-lg">Referral Income</h3>
              <p className="text-muted-foreground">
                Earn ₹500 for each friend who joins using your referral link and plays actively. If you become a Team Leader (10+ active referrals), you'll earn ₹500 per month for each active referred player!
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <HelpCircle className="mr-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">How do I start playing?</h3>
              <p className="text-muted-foreground">
                Simply register with your email address, verify your account, and you can immediately start playing quizzes and earning points.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-lg">Is there a minimum withdrawal amount?</h3>
              <p className="text-muted-foreground">
                Yes, the minimum withdrawal amount is ₹8000 (equivalent to 12,000 points).
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-lg">How long do referral benefits last?</h3>
              <p className="text-muted-foreground">
                For regular members, you get a one-time ₹500 bonus for each active referral. For Team Leaders, you earn ₹500 per month for each active referred player, as long as they remain active.
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <Button size="lg" asChild className="fun-button">
            <Link to="/quiz">
              Start Playing Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
      
      <Footer />
    </main>
  );
};

export default HowToPlay;
