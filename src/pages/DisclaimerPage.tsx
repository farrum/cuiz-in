
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const DisclaimerPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
        <div className="quiz-card">
          <h1 className="text-3xl font-bold mb-6">Game Disclaimer</h1>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">General Disclaimer</h2>
              <p className="text-muted-foreground">
                CuizIN is an educational quiz platform designed for entertainment and learning purposes. While we offer rewards for participation, CuizIN is not a gambling platform.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">Rewards System</h2>
              <p className="text-muted-foreground">
                Rewards are earned through active participation, correct answers, and referrals. The amount and frequency of rewards may change based on platform policies.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">No Guarantee of Income</h2>
              <p className="text-muted-foreground">
                While CuizIN provides opportunities to earn rewards, we do not guarantee any specific level of income or earnings.
              </p>
            </section>
            
            {/* Add more sections as needed */}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DisclaimerPage;
