
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdvertisementBanner from '@/components/AdvertisementBanner';

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
              <p className="text-muted-foreground mt-2">
                CuizIN reserves the right to suspend or terminate your account if any information provided during registration or thereafter proves to be inaccurate, false, or misleading.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">4. User Conduct</h2>
              <p className="text-muted-foreground">
                You agree not to engage in any of the following prohibited activities:
              </p>
              <ul className="list-disc list-inside mt-2 text-muted-foreground">
                <li>Violating any laws, third-party rights, or our policies</li>
                <li>Using automated means to access or interact with the service</li>
                <li>Attempting to manipulate the reward system</li>
                <li>Creating multiple accounts to gain additional benefits</li>
                <li>Sharing account credentials with others</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">5. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content, features, and functionality of the CuizIN service, including but not limited to text, graphics, logos, icons, and software, are the exclusive property of CuizIN and are protected by copyright, trademark, and other intellectual property laws.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">6. Rewards and Payments</h2>
              <p className="text-muted-foreground">
                CuizIN may offer rewards for participation in quizzes and other activities. These rewards are subject to the specific terms and conditions provided at the time they are offered.
              </p>
              <p className="text-muted-foreground mt-2">
                Payments are processed securely through our payment partners. CuizIN reserves the right to withhold payment if we suspect fraudulent activity.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">7. Termination</h2>
              <p className="text-muted-foreground">
                CuizIN reserves the right to terminate or suspend your account and access to the service at any time, without prior notice or liability, for any reason.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                CuizIN shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, or use, resulting from your access to or use of the service.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">9. Changes to Terms</h2>
              <p className="text-muted-foreground">
                CuizIN reserves the right to modify these Terms of Service at any time. We will provide notice of significant changes by updating the date at the top of this page or by other means as determined by CuizIN.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">10. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction in which CuizIN operates, without regard to its conflict of law provisions.
              </p>
            </section>
          </div>
          
          <AdvertisementBanner position="bottom" slotId="terms-bottom" pageSection="terms-page" className="mt-8" />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsPage;
