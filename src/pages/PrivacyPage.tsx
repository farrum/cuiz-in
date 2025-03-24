
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
        <div className="quiz-card">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
              <p className="text-muted-foreground">
                We collect information you provide when creating an account, including your name, email address, and optional profile information.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
              <p className="text-muted-foreground">
                We use your information to provide the CuizIN service, process rewards, improve our platform, and communicate with you about your account.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">Data Security</h2>
              <p className="text-muted-foreground">
                We implement reasonable security measures to protect your personal information from unauthorized access, alteration, or disclosure.
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

export default PrivacyPage;
