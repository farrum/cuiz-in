
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
        <div className="quiz-card">
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using CuizIN, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">2. Eligibility</h2>
              <p className="text-muted-foreground">
                You must be at least 18 years old to use CuizIN. By using the service, you represent and warrant that you are at least 18 years of age.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
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

export default TermsPage;
